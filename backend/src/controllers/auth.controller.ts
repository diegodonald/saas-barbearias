import { Request, Response } from 'express';
import { AuthService } from '@/services/auth.service';
import { logger } from '@/config/logger';
import { ApiResponse } from '@/types/api';
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
} from '@/types/auth';

export class AuthController {
  /**
   * Registrar novo usuário
   * POST /api/auth/register
   */
  static async register(
    req: Request<Record<string, never>, ApiResponse, RegisterRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const result = await AuthService.register(req.body);

      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: result,
      });
    } catch (error) {
      logger.error('Erro no controller de registro:', error);

      if (error instanceof Error) {
        if (error.message === 'Email já está em uso') {
          res.status(409).json({
            success: false,
            message: 'Email já está em uso',
            error: 'EMAIL_ALREADY_EXISTS',
          });
          return;
        }

        if (error.message.startsWith('Senha fraca:')) {
          res.status(422).json({
            success: false,
            message: error.message,
            error: 'WEAK_PASSWORD',
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
  }

  /**
   * Login do usuário
   * POST /api/auth/login
   */
  static async login(
    req: Request<Record<string, never>, ApiResponse, LoginRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const result = await AuthService.login(req.body);

      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        data: result,
      });
    } catch (error) {
      logger.error('Erro no controller de login:', error);

      if (error instanceof Error) {
        if (error.message === 'Credenciais inválidas') {
          res.status(401).json({
            success: false,
            message: 'Email ou senha incorretos',
            error: 'INVALID_CREDENTIALS',
          });
          return;
        }

        if (error.message === 'Conta de barbeiro desativada') {
          res.status(403).json({
            success: false,
            message: 'Sua conta foi desativada. Entre em contato com o administrador.',
            error: 'ACCOUNT_DISABLED',
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
  }

  /**
   * Refresh token
   * POST /api/auth/refresh
   */
  static async refreshToken(
    req: Request<Record<string, never>, ApiResponse, { refreshToken: string }>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token renovado com sucesso',
        data: result,
      });
    } catch (error) {
      logger.error('Erro no controller de refresh token:', error);

      if (error instanceof Error) {
        if (error.message.includes('token')) {
          res.status(401).json({
            success: false,
            message: 'Refresh token inválido ou expirado',
            error: 'INVALID_REFRESH_TOKEN',
          });
          return;
        }

        if (error.message === 'Usuário não encontrado') {
          res.status(401).json({
            success: false,
            message: 'Usuário não encontrado',
            error: 'USER_NOT_FOUND',
          });
          return;
        }

        if (error.message === 'Conta de barbeiro desativada') {
          res.status(403).json({
            success: false,
            message: 'Sua conta foi desativada',
            error: 'ACCOUNT_DISABLED',
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
  }

  /**
   * Esqueci a senha
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(
    req: Request<Record<string, never>, ApiResponse, ForgotPasswordRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      await AuthService.forgotPassword(req.body);

      res.status(200).json({
        success: true,
        message: 'Se o email existir, você receberá instruções para redefinir sua senha',
      });
    } catch (error) {
      logger.error('Erro no controller de esqueci a senha:', error);

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Reset de senha
   * POST /api/auth/reset-password
   */
  static async resetPassword(
    req: Request<Record<string, never>, ApiResponse, ResetPasswordRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      await AuthService.resetPassword(req.body);

      res.status(200).json({
        success: true,
        message: 'Senha redefinida com sucesso',
      });
    } catch (error) {
      logger.error('Erro no controller de reset de senha:', error);

      if (error instanceof Error) {
        if (error.message.startsWith('Senha fraca:')) {
          res.status(422).json({
            success: false,
            message: error.message,
            error: 'WEAK_PASSWORD',
          });
          return;
        }

        if (error.message.includes('token')) {
          res.status(400).json({
            success: false,
            message: 'Token de reset inválido ou expirado',
            error: 'INVALID_RESET_TOKEN',
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
  }

  /**
   * Mudança de senha
   * POST /api/auth/change-password
   */
  static async changePassword(
    req: Request<Record<string, never>, ApiResponse, ChangePasswordRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
          error: 'NOT_AUTHENTICATED',
        });
        return;
      }

      await AuthService.changePassword(req.user.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Senha alterada com sucesso',
      });
    } catch (error) {
      logger.error('Erro no controller de mudança de senha:', error);

      if (error instanceof Error) {
        if (error.message === 'Senha atual incorreta') {
          res.status(400).json({
            success: false,
            message: 'Senha atual incorreta',
            error: 'INCORRECT_CURRENT_PASSWORD',
          });
          return;
        }

        if (error.message.startsWith('Senha fraca:')) {
          res.status(422).json({
            success: false,
            message: error.message,
            error: 'WEAK_PASSWORD',
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
  }

  /**
   * Atualizar perfil
   * PUT /api/auth/profile
   */
  static async updateProfile(
    req: Request<Record<string, never>, ApiResponse, UpdateProfileRequest>,
    res: Response<ApiResponse>
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
          error: 'NOT_AUTHENTICATED',
        });
        return;
      }

      const result = await AuthService.updateProfile(req.user.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: result,
      });
    } catch (error) {
      logger.error('Erro no controller de atualização de perfil:', error);

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Obter perfil do usuário logado
   * GET /api/auth/me
   */
  static async getProfile(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
          error: 'NOT_AUTHENTICATED',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Perfil obtido com sucesso',
        data: req.user,
      });
    } catch (error) {
      logger.error('Erro no controller de obter perfil:', error);

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Logout (invalidar token)
   * POST /api/auth/logout
   */
  static async logout(_req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      // TODO: Implementar blacklist de tokens ou invalidação
      // Por enquanto, apenas retornar sucesso

      res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso',
      });
    } catch (error) {
      logger.error('Erro no controller de logout:', error);

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_ERROR',
      });
    }
  }
}
