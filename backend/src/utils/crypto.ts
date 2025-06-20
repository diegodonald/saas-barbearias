import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { logger } from '@/config/logger';

// Classe para operações criptográficas
export class CryptoManager {
  private static readonly SALT_ROUNDS = 12;
  private static readonly RESET_TOKEN_LENGTH = 32;

  /**
   * Hash de senha usando bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(CryptoManager.SALT_ROUNDS);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      logger.error('Erro ao fazer hash da senha:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  /**
   * Verificar senha
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      logger.error('Erro ao verificar senha:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  /**
   * Gerar token aleatório para reset de senha
   */
  static generateResetToken(): string {
    return crypto.randomBytes(CryptoManager.RESET_TOKEN_LENGTH).toString('hex');
  }

  /**
   * Gerar hash do token de reset
   */
  static hashResetToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Gerar ID único
   */
  static generateUniqueId(): string {
    return crypto.randomUUID();
  }

  /**
   * Gerar código numérico aleatório
   */
  static generateNumericCode(length: number = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  /**
   * Validar força da senha
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    // Verificar comprimento mínimo
    if (password.length < 8) {
      errors.push('A senha deve ter pelo menos 8 caracteres');
    } else {
      score += 1;
    }

    // Verificar se tem letras minúsculas
    if (!/[a-z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra minúscula');
    } else {
      score += 1;
    }

    // Verificar se tem letras maiúsculas
    if (!/[A-Z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra maiúscula');
    } else {
      score += 1;
    }

    // Verificar se tem números
    if (!/\d/.test(password)) {
      errors.push('A senha deve conter pelo menos um número');
    } else {
      score += 1;
    }

    // Verificar se tem caracteres especiais
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('A senha deve conter pelo menos um caractere especial');
    } else {
      score += 1;
    }

    // Verificar se não tem sequências comuns
    const commonSequences = ['123456', 'abcdef', 'qwerty', 'password'];
    const lowerPassword = password.toLowerCase();

    for (const sequence of commonSequences) {
      if (lowerPassword.includes(sequence)) {
        errors.push('A senha não deve conter sequências comuns');
        score -= 1;
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.max(0, score),
    };
  }

  /**
   * Gerar senha aleatória segura
   */
  static generateSecurePassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';

    // Garantir pelo menos um caractere de cada tipo
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Preencher o resto aleatoriamente
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Embaralhar a senha
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * Criptografar dados sensíveis
   */
  static encrypt(text: string, key: string): string {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Descriptografar dados sensíveis
   */
  static decrypt(encryptedText: string, key: string): string {
    const algorithm = 'aes-256-gcm';
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Formato de texto criptografado inválido');
    }

    const encrypted = parts[1]!;

    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// Funções de conveniência
export const hashPassword = CryptoManager.hashPassword;
export const verifyPassword = CryptoManager.verifyPassword;
export const generateResetToken = CryptoManager.generateResetToken;
export const hashResetToken = CryptoManager.hashResetToken;
export const generateUniqueId = CryptoManager.generateUniqueId;
export const generateNumericCode = CryptoManager.generateNumericCode;
export const validatePasswordStrength = CryptoManager.validatePasswordStrength;
export const generateSecurePassword = CryptoManager.generateSecurePassword;
