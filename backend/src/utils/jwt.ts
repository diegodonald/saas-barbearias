import jwt from 'jsonwebtoken';
import { config } from '@/config/env';
import { JWTPayload, RefreshTokenPayload } from '@/types/auth';
import { logger } from '@/config/logger';

// Classe para gerenciar JWT tokens
export class JWTManager {
  private static accessTokenSecret = config.jwt.secret;
  private static refreshTokenSecret = `${config.jwt.secret}_refresh`;
  private static accessTokenExpiry = config.jwt.expiresIn;
  private static refreshTokenExpiry = config.jwt.refreshExpiresIn;

  /**
   * Gerar access token
   */
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    try {
      return jwt.sign(payload as object, JWTManager.accessTokenSecret, {
        expiresIn: JWTManager.accessTokenExpiry as any,
        issuer: 'saas-barbearias',
        audience: 'saas-barbearias-users',
      });
    } catch (error) {
      logger.error('Erro ao gerar access token:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  /**
   * Gerar refresh token
   */
  static generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
    try {
      return jwt.sign(payload as object, JWTManager.refreshTokenSecret, {
        expiresIn: JWTManager.refreshTokenExpiry as any,
        issuer: 'saas-barbearias',
        audience: 'saas-barbearias-refresh',
      });
    } catch (error) {
      logger.error('Erro ao gerar refresh token:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  /**
   * Verificar access token
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, JWTManager.accessTokenSecret, {
        issuer: 'saas-barbearias',
        audience: 'saas-barbearias-users',
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expirado');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token inválido');
      }
      logger.error('Erro ao verificar access token:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  /**
   * Verificar refresh token
   */
  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, JWTManager.refreshTokenSecret, {
        issuer: 'saas-barbearias',
        audience: 'saas-barbearias-refresh',
      }) as RefreshTokenPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expirado');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Refresh token inválido');
      }
      logger.error('Erro ao verificar refresh token:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  /**
   * Decodificar token sem verificar (para debug)
   */
  static decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Erro ao decodificar token:', error);
      return null;
    }
  }

  /**
   * Obter tempo de expiração do token em segundos
   */
  static getTokenExpirationTime(): number {
    // Converter string como "7d" para segundos
    const expiry = JWTManager.accessTokenExpiry;

    if (expiry.endsWith('d')) {
      return parseInt(expiry) * 24 * 60 * 60;
    }
    if (expiry.endsWith('h')) {
      return parseInt(expiry) * 60 * 60;
    }
    if (expiry.endsWith('m')) {
      return parseInt(expiry) * 60;
    }
    if (expiry.endsWith('s')) {
      return parseInt(expiry);
    }

    // Assumir segundos se não tiver sufixo
    return parseInt(expiry) || 3600; // 1 hora por padrão
  }

  /**
   * Verificar se token está próximo do vencimento
   */
  static isTokenNearExpiry(token: string, thresholdMinutes: number = 15): boolean {
    try {
      const decoded = JWTManager.decodeToken(token);
      if (!decoded || !decoded.exp) return true;

      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - now;
      const thresholdSeconds = thresholdMinutes * 60;

      return timeUntilExpiry <= thresholdSeconds;
    } catch (error) {
      return true; // Se não conseguir decodificar, assumir que precisa renovar
    }
  }
}

// Funções de conveniência
export const generateAccessToken = JWTManager.generateAccessToken;
export const generateRefreshToken = JWTManager.generateRefreshToken;
export const verifyAccessToken = JWTManager.verifyAccessToken;
export const verifyRefreshToken = JWTManager.verifyRefreshToken;
export const decodeToken = JWTManager.decodeToken;
export const getTokenExpirationTime = JWTManager.getTokenExpirationTime;
export const isTokenNearExpiry = JWTManager.isTokenNearExpiry;
