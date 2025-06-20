import { Role } from '@prisma/client';
import { prisma } from '@/config/database';
import { advancedLogger } from '@/config/logger';
import { Cacheable, CacheEvict } from '@/utils/cache-decorators';
import { CACHE_TTL, CACHE_PREFIXES } from '@/config/redis';
import {
  hashPassword,
  verifyPassword,
  generateResetToken,
  hashResetToken,
  validatePasswordStrength,
} from '@/utils/crypto';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getTokenExpirationTime,
} from '@/utils/jwt';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  AuthenticatedUser,
} from '@/types/auth';

export class AuthService {
  /**
   * Registrar novo usuário
   */
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Verificar se email já existe
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new Error('Email já está em uso');
      }

      // Validar força da senha
      const passwordValidation = validatePasswordStrength(data.password);
      if (!passwordValidation.isValid) {
        throw new Error(`Senha fraca: ${passwordValidation.errors.join(', ')}`);
      }

      // Hash da senha
      const hashedPassword = await hashPassword(data.password);

      // Criar usuário
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          phone: data.phone ?? null,
          role: data.role ?? Role.CLIENT,
        },
        include: {
          barberProfile: {
            select: {
              id: true,
              barbershopId: true,
            },
          },
          barbershop: {
            select: {
              id: true,
            },
          },
        },
      });

      // Se for barbeiro, criar perfil de barbeiro (será feito pelo admin depois)
      // Se for cliente, criar perfil de cliente
      if (user.role === Role.CLIENT) {
        await prisma.client.create({
          data: {
            userId: user.id,
          },
        });
      }

      advancedLogger.business({
        type: 'USER_REGISTRATION',
        entity: 'user',
        entityId: user.id,
        action: 'CREATE',
        userId: user.id,
        metadata: { email: user.email, role: user.role },
      });

      // Gerar tokens
      const tokens = this.generateTokensForUser(user);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone ?? undefined,
          avatar: user.avatar ?? undefined,
          barbershopId: user.barbershop?.id ?? user.barberProfile?.barbershopId ?? undefined,
          barberId: user.barberProfile?.id ?? undefined,
        },
        ...tokens,
      };
    } catch (error) {
      advancedLogger.error('Erro no registro de usuário', error as Error, {
        metadata: { email: data.email },
      });
      throw error;
    }
  }

  /**
   * Login do usuário
   */
  static async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Buscar usuário por email
      const user = await prisma.user.findUnique({
        where: { email: data.email },
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
        throw new Error('Credenciais inválidas');
      }

      // Verificar senha
      const isPasswordValid = await verifyPassword(data.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Credenciais inválidas');
      }

      // Verificar se barbeiro está ativo
      if (user.role === Role.BARBER && user.barberProfile && !user.barberProfile.isActive) {
        throw new Error('Conta de barbeiro desativada');
      }

      advancedLogger.security({
        type: 'LOGIN_SUCCESS',
        userId: user.id,
        ip: '',
        userAgent: '',
        details: { email: user.email, role: user.role, timestamp: new Date() },
        severity: 'LOW',
      });

      // Gerar tokens
      const tokens = this.generateTokensForUser(user);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone ?? undefined,
          avatar: user.avatar ?? undefined,
          barbershopId: user.barbershop?.id ?? user.barberProfile?.barbershopId ?? undefined,
          barberId: user.barberProfile?.id ?? undefined,
        },
        ...tokens,
      };
    } catch (error) {
      advancedLogger.error('Erro no login', error as Error);
      throw error;
    }
  }

  /**
   * Refresh token
   */
  static async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verificar refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Buscar usuário
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
        throw new Error('Usuário não encontrado');
      }

      // Verificar se barbeiro está ativo
      if (user.role === Role.BARBER && user.barberProfile && !user.barberProfile.isActive) {
        throw new Error('Conta de barbeiro desativada');
      }

      advancedLogger.info('Token renovado', { userId: user.id, metadata: { email: user.email } });

      // Gerar novos tokens
      const tokens = this.generateTokensForUser(user);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone ?? undefined,
          avatar: user.avatar ?? undefined,
          barbershopId: user.barbershop?.id ?? user.barberProfile?.barbershopId ?? undefined,
          barberId: user.barberProfile?.id ?? undefined,
        },
        ...tokens,
      };
    } catch (error) {
      advancedLogger.error('Erro no refresh token', error as Error);
      throw error;
    }
  }

  /**
   * Esqueci a senha
   */
  static async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (!user) {
        // Por segurança, não revelar se o email existe
        advancedLogger.warn('Tentativa de reset para email inexistente', {
          metadata: { email: data.email },
        });
        return;
      }

      // Gerar token de reset
      const resetToken = generateResetToken();
      const hashedToken = hashResetToken(resetToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Salvar token no banco (implementar tabela de reset tokens)
      // Por enquanto, apenas log
      advancedLogger.info('Token de reset gerado', {
        userId: user.id,
        metadata: { email: user.email, expiresAt, hashedToken },
      });

      // TODO: Enviar email com token de reset
      // await emailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (error) {
      advancedLogger.error('Erro no esqueci a senha', error as Error);
      throw error;
    }
  }

  /**
   * Reset de senha
   */
  static async resetPassword(data: ResetPasswordRequest): Promise<void> {
    try {
      // TODO: Implementar verificação do token de reset
      // Por enquanto, apenas validar a senha

      const passwordValidation = validatePasswordStrength(data.password);
      if (!passwordValidation.isValid) {
        throw new Error(`Senha fraca: ${passwordValidation.errors.join(', ')}`);
      }

      // Hash da nova senha
      const hashedPassword = await hashPassword(data.password);

      // TODO: Atualizar senha do usuário baseado no token
      advancedLogger.info('Reset de senha realizado', {
        metadata: { token: data.token, hashedPassword },
      });
    } catch (error) {
      advancedLogger.error('Erro no reset de senha', error as Error);
      throw error;
    }
  }

  /**
   * Mudança de senha
   */
  static async changePassword(userId: string, data: ChangePasswordRequest): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar senha atual
      const isCurrentPasswordValid = await verifyPassword(data.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Senha atual incorreta');
      }

      // Validar nova senha
      const passwordValidation = validatePasswordStrength(data.newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`Senha fraca: ${passwordValidation.errors.join(', ')}`);
      }

      // Hash da nova senha
      const hashedPassword = await hashPassword(data.newPassword);

      // Atualizar senha
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      advancedLogger.business({
        type: 'PASSWORD_CHANGE',
        entity: 'user',
        entityId: user.id,
        action: 'UPDATE',
        userId: user.id,
        metadata: { email: user.email },
      });
    } catch (error) {
      advancedLogger.error('Erro na mudança de senha', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Atualizar perfil
   */
  static async updateProfile(
    userId: string,
    data: UpdateProfileRequest
  ): Promise<AuthenticatedUser> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.avatar !== undefined && { avatar: data.avatar }),
        },
        include: {
          barberProfile: {
            select: {
              id: true,
              barbershopId: true,
            },
          },
          barbershop: {
            select: {
              id: true,
            },
          },
        },
      });

      advancedLogger.business({
        type: 'PROFILE_UPDATE',
        entity: 'user',
        entityId: user.id,
        action: 'UPDATE',
        userId: user.id,
        metadata: { email: user.email },
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone ?? undefined,
        avatar: user.avatar ?? undefined,
        barbershopId: user.barbershop?.id ?? user.barberProfile?.barbershopId ?? undefined,
        barberId: user.barberProfile?.id ?? undefined,
      };
    } catch (error) {
      advancedLogger.error('Erro na atualização do perfil', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Gerar tokens para usuário
   */
  private static generateTokensForUser(user: any) {
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      barbershopId: user.barbershop?.id ?? user.barberProfile?.barbershopId,
      barberId: user.barberProfile?.id,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenVersion: 1, // TODO: Implementar versionamento de tokens
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: getTokenExpirationTime(),
    };
  }

  /**
   * Buscar usuário por ID com cache
   */
  @Cacheable({
    ttl: CACHE_TTL.MEDIUM,
    prefix: CACHE_PREFIXES.USER,
    keyGenerator: (userId: string) => `profile:${userId}`,
  })
  static async getUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        barbershop: true,
        barberProfile: true,
      },
    });
  }

  /**
   * Invalidar cache do usuário
   */
  @CacheEvict({
    pattern: `${CACHE_PREFIXES.USER}profile:*`,
  })
  static async invalidateUserCache(userId: string): Promise<void> {
    // Método para invalidar cache específico do usuário
    advancedLogger.info('Cache do usuário invalidado', { userId });
  }
}
