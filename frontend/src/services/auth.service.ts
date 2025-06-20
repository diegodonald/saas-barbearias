import ApiService from './api';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  User,
} from '@/types/auth';

export class AuthService {
  /**
   * Login do usuário
   */
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await ApiService.post<AuthResponse>(
      '/auth/login',
      credentials
    );

    // Salvar tokens no localStorage
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  }

  /**
   * Registro de novo usuário
   */
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await ApiService.post<AuthResponse>(
      '/auth/register',
      data
    );

    // Salvar tokens no localStorage
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  }

  /**
   * Logout do usuário
   */
  static async logout(): Promise<void> {
    try {
      await ApiService.post('/auth/logout');
    } catch (error) {
      // Mesmo se der erro na API, limpar dados locais
      console.warn('Erro no logout da API:', error);
    } finally {
      // Limpar dados do localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  /**
   * Renovar token de acesso
   */
  static async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('Refresh token não encontrado');
    }

    const response = await ApiService.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    });

    // Atualizar tokens no localStorage
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  }

  /**
   * Obter perfil do usuário logado
   */
  static async getProfile(): Promise<User> {
    return await ApiService.get<User>('/auth/me');
  }

  /**
   * Atualizar perfil do usuário
   */
  static async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await ApiService.put<User>('/auth/profile', data);

    // Atualizar dados do usuário no localStorage
    localStorage.setItem('user', JSON.stringify(response));

    return response;
  }

  /**
   * Alterar senha
   */
  static async changePassword(data: ChangePasswordRequest): Promise<void> {
    await ApiService.post('/auth/change-password', data);
  }

  /**
   * Esqueci a senha
   */
  static async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await ApiService.post('/auth/forgot-password', data);
  }

  /**
   * Redefinir senha
   */
  static async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await ApiService.post('/auth/reset-password', data);
  }

  /**
   * Verificar se usuário está autenticado
   */
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  /**
   * Obter usuário do localStorage
   */
  static getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Erro ao parsear usuário do localStorage:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Obter token de acesso
   */
  static getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Verificar se token está próximo do vencimento
   */
  static isTokenNearExpiry(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;

      // Renovar se faltam menos de 15 minutos
      return timeUntilExpiry <= 15 * 60;
    } catch (error) {
      return true;
    }
  }

  /**
   * Verificar se usuário tem permissão
   */
  static hasRole(requiredRole: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    const roleHierarchy = {
      SUPER_ADMIN: 4,
      ADMIN: 3,
      BARBER: 2,
      CLIENT: 1,
    };

    const userLevel =
      roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel =
      roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  }

  /**
   * Verificar se usuário pode acessar recurso
   */
  static canAccess(resource: string, action: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // SuperAdmin pode tudo
    if (user.role === 'SUPER_ADMIN') return true;

    // Lógica específica por role
    switch (user.role) {
      case 'ADMIN':
        return ['barbershop', 'barbers', 'services', 'appointments'].includes(
          resource
        );

      case 'BARBER':
        return (
          ['own_schedule', 'own_profile', 'appointments'].includes(resource) &&
          ['view', 'update'].includes(action)
        );

      case 'CLIENT':
        return (
          ['own_profile', 'appointments'].includes(resource) &&
          ['view', 'create', 'update'].includes(action)
        );

      default:
        return false;
    }
  }
}
