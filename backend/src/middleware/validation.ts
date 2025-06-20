import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { ApiResponse, ValidationError } from '@/types/api';
import { logger } from '@/config/logger';

/**
 * Middleware de validação usando Zod
 */
export const validate = (schema: { body?: ZodSchema; params?: ZodSchema; query?: ZodSchema }) => {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
    try {
      const errors: ValidationError[] = [];

      // Validar body
      if (schema.body) {
        try {
          req.body = schema.body.parse(req.body);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...formatZodErrors(error, 'body'));
          }
        }
      }

      // Validar params
      if (schema.params) {
        try {
          req.params = schema.params.parse(req.params);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...formatZodErrors(error, 'params'));
          }
        }
      }

      // Validar query
      if (schema.query) {
        try {
          req.query = schema.query.parse(req.query);
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...formatZodErrors(error, 'query'));
          }
        }
      }

      // Se houver erros, retornar resposta de erro
      if (errors.length > 0) {
        logger.warn('Erro de validação:', errors);

        res.status(422).json({
          success: false,
          message: 'Dados inválidos',
          error: 'VALIDATION_ERROR',
          errors,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Erro no middleware de validação:', error);

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_ERROR',
      });
    }
  };
};

/**
 * Formatar erros do Zod para o formato da API
 */
function formatZodErrors(error: ZodError, source: string): ValidationError[] {
  return error.errors.map((err) => ({
    field: `${source}.${err.path.join('.')}`,
    message: err.message,
    code: err.code,
  }));
}

// Schemas de validação comuns
export const commonSchemas = {
  // ID válido (CUID)
  id: z.string().cuid('ID inválido'),

  // Email válido
  email: z.string().email('Email inválido'),

  // Senha forte
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/\d/, 'Senha deve conter pelo menos um número')
    .regex(
      /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
      'Senha deve conter pelo menos um caractere especial'
    ),

  // Nome válido
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),

  // Telefone válido (formato brasileiro)
  phone: z
    .union([
      z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX'),
      z.literal(''),
    ])
    .optional(),

  // URL válida
  url: z.string().url('URL inválida').optional(),

  // Paginação
  pagination: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),

  // Busca
  search: z.object({
    search: z.string().optional(),
  }),
};

// Schemas específicos para autenticação
export const authSchemas = {
  // Login
  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Senha é obrigatória'),
  }),

  // Registro
  register: z.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    password: commonSchemas.password,
    phone: commonSchemas.phone,
    role: z.enum(['CLIENT', 'BARBER', 'ADMIN']).optional(),
  }),

  // Esqueci a senha
  forgotPassword: z.object({
    email: commonSchemas.email,
  }),

  // Reset de senha
  resetPassword: z.object({
    token: z.string().min(1, 'Token é obrigatório'),
    password: commonSchemas.password,
  }),

  // Mudança de senha
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: commonSchemas.password,
  }),

  // Atualização de perfil
  updateProfile: z.object({
    name: commonSchemas.name.optional(),
    phone: commonSchemas.phone,
    avatar: commonSchemas.url,
  }),

  // Refresh token
  refreshToken: z.object({
    refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
  }),
};

// Schemas para parâmetros de rota
export const paramSchemas = {
  // ID genérico
  id: z.object({
    id: commonSchemas.id,
  }),

  // User ID
  userId: z.object({
    userId: commonSchemas.id,
  }),

  // Barbershop ID
  barbershopId: z.object({
    barbershopId: commonSchemas.id,
  }),

  // Barber ID
  barberId: z.object({
    barberId: commonSchemas.id,
  }),
};

// Função helper para criar validação de body
export const validateBody = (schema: ZodSchema) => validate({ body: schema });

// Função helper para criar validação de params
export const validateParams = (schema: ZodSchema) => validate({ params: schema });

// Função helper para criar validação de query
export const validateQuery = (schema: ZodSchema) => validate({ query: schema });

// Função helper para validação completa
export const validateAll = (schemas: { body?: ZodSchema; params?: ZodSchema; query?: ZodSchema }) =>
  validate(schemas);
