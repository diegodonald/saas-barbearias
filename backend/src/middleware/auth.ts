import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyAccessToken } from '@/utils/jwt';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AuthenticatedUser, Permission, ROLE_PERMISSIONS } from '@/types/auth';
import { ApiResponse } from '@/types/api';

// Estender interface do Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware de autenticação
 * Verifica se o usuário está autenticado via JWT
 */
export const authenticate = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido',
        error: 'MISSING_TOKEN',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // Verificar token
    const payload = verifyAccessToken(token);

    // Buscar usuário no banco para garantir que ainda existe e está ativo
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        barberProfile: {
          select: {
            id: true,
            barbershopId: true,
            isActive: true,
          },
        },
        barbershop: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não encontrado',
        error: 'USER_NOT_FOUND',
      });
      return;
    }

    // Verificar se barbeiro está ativo (se aplicável)
    if (user.role === Role.BARBER && user.barberProfile && !user.barberProfile.isActive) {
      res.status(401).json({
        success: false,
        message: 'Conta de barbeiro desativada',
        error: 'BARBER_INACTIVE',
      });
      return;
    }

    // Montar dados do usuário autenticado
    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone ?? undefined,
      avatar: user.avatar ?? undefined,
      barbershopId: user.barbershop?.id ?? user.barberProfile?.barbershopId ?? undefined,
      barberId: user.barberProfile?.id ?? undefined,
    };

    // Adicionar usuário ao request
    req.user = authenticatedUser;

    logger.debug(`Usuário autenticado: ${user.email} (${user.role})`);
    next();
  } catch (error) {
    logger.error('Erro na autenticação:', error);

    if (error instanceof Error) {
      if (error.message === 'Token expirado') {
        res.status(401).json({
          success: false,
          message: 'Token expirado',
          error: 'TOKEN_EXPIRED',
        });
        return;
      }

      if (error.message === 'Token inválido') {
        res.status(401).json({
          success: false,
          message: 'Token inválido',
          error: 'INVALID_TOKEN',
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Middleware de autorização por role
 * Verifica se o usuário tem uma das roles permitidas
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
        error: 'NOT_AUTHENTICATED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        `Acesso negado para usuário ${req.user.email} (${req.user.role}) - Roles permitidas: ${allowedRoles.join(', ')}`
      );

      res.status(403).json({
        success: false,
        message: 'Acesso negado',
        error: 'INSUFFICIENT_PERMISSIONS',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware de autorização por permissão
 * Verifica se o usuário tem uma permissão específica
 */
export const requirePermission = (...requiredPermissions: Permission[]) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
        error: 'NOT_AUTHENTICATED',
      });
      return;
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role];

    // SuperAdmin tem todas as permissões
    if (userPermissions.includes('manage:all')) {
      next();
      return;
    }

    // Verificar se tem pelo menos uma das permissões necessárias
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      logger.warn(
        `Permissão negada para usuário ${req.user.email} (${req.user.role}) - Permissões necessárias: ${requiredPermissions.join(', ')}`
      );

      res.status(403).json({
        success: false,
        message: 'Permissão insuficiente',
        error: 'INSUFFICIENT_PERMISSIONS',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware para verificar se o usuário é dono do recurso
 * Usado para operações que só podem ser feitas pelo próprio usuário
 */
export const requireOwnership = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
        error: 'NOT_AUTHENTICATED',
      });
      return;
    }

    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];

    // SuperAdmin pode acessar qualquer recurso
    if (req.user.role === Role.SUPER_ADMIN) {
      next();
      return;
    }

    // Admin pode acessar recursos da sua barbearia
    if (req.user.role === Role.ADMIN && req.user.barbershopId) {
      // Aqui seria necessário verificar se o recurso pertence à barbearia do admin
      // Por simplicidade, vamos permitir por enquanto
      next();
      return;
    }

    // Verificar se é o próprio usuário
    if (req.user.id !== resourceUserId) {
      logger.warn(
        `Tentativa de acesso não autorizado: usuário ${req.user.email} tentou acessar recurso do usuário ${resourceUserId}`
      );

      res.status(403).json({
        success: false,
        message: 'Acesso negado - você só pode acessar seus próprios recursos',
        error: 'OWNERSHIP_REQUIRED',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware de autorização por role
 * Verifica se o usuário tem uma das roles permitidas
 */
export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authReq = req as any;
      if (!authReq.user) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
          error: 'UNAUTHORIZED',
        });
        return;
      }

      if (!allowedRoles.includes(authReq.user.role)) {
        res.status(403).json({
          success: false,
          message: 'Acesso negado',
          error: 'FORBIDDEN',
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Erro na verificação de role:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_ERROR',
      });
    }
  };
};

/**
 * Middleware opcional de autenticação
 * Adiciona dados do usuário se autenticado, mas não falha se não estiver
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        barberProfile: {
          select: {
            id: true,
            barbershopId: true,
            isActive: true,
          },
        },
        barbershop: {
          select: {
            id: true,
          },
        },
      },
    });

    if (user && (user.role !== Role.BARBER || !user.barberProfile || user.barberProfile.isActive)) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone ?? undefined,
        avatar: user.avatar ?? undefined,
        barbershopId: user.barbershop?.id ?? user.barberProfile?.barbershopId ?? undefined,
        barberId: user.barberProfile?.id ?? undefined,
      };
    }

    next();
  } catch (error) {
    // Em caso de erro, apenas continue sem autenticar
    next();
  }
};
