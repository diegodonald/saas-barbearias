import { Role } from '@prisma/client';

// Interface para payload do JWT
export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  barbershopId?: string; // para admins e barbeiros
  barberId?: string; // para barbeiros
  iat: number;
  exp: number;
}

// Interface para refresh token payload
export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}

// Interface para dados de login
export interface LoginRequest {
  email: string;
  password: string;
}

// Interface para dados de registro
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: Role;
}

// Interface para resposta de autenticação
export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    phone?: string | undefined;
    avatar?: string | undefined;
    barbershopId?: string | undefined;
    barberId?: string | undefined;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Interface para dados do usuário autenticado
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string | undefined;
  avatar?: string | undefined;
  barbershopId?: string | undefined;
  barberId?: string | undefined;
}

// Interface para reset de senha
export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// Interface para mudança de senha
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Interface para atualização de perfil
export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  avatar?: string;
}

// Tipos para middleware de autorização
export type Permission =
  | 'manage:all' // SuperAdmin
  | 'manage:barbershop' // Admin
  | 'manage:own_schedule' // Barber
  | 'manage:own_profile' // Client
  | 'view:appointments'
  | 'create:appointments'
  | 'update:appointments'
  | 'delete:appointments';

export interface RolePermissions {
  [Role.SUPER_ADMIN]: Permission[];
  [Role.ADMIN]: Permission[];
  [Role.BARBER]: Permission[];
  [Role.CLIENT]: Permission[];
}

// Constantes de permissões
export const ROLE_PERMISSIONS: RolePermissions = {
  [Role.SUPER_ADMIN]: ['manage:all'],
  [Role.ADMIN]: [
    'manage:barbershop',
    'view:appointments',
    'create:appointments',
    'update:appointments',
    'delete:appointments',
  ],
  [Role.BARBER]: [
    'manage:own_schedule',
    'manage:own_profile',
    'view:appointments',
    'update:appointments',
  ],
  [Role.CLIENT]: ['manage:own_profile', 'view:appointments', 'create:appointments'],
};

// Interface para contexto de request autenticado
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
