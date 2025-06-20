import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthService } from '@/services/auth.service';
import {
  AuthContextType,
  AuthState,
  User,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '@/types/auth';
import { ApiError } from '@/types/api';
import toast from 'react-hot-toast';

// Estado inicial
const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
};

// Tipos de ações
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string } };

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      };

    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };

    case 'REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
      };

    default:
      return state;
  }
}

// Criar contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar autenticação ao carregar a aplicação
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        // Verificar se há dados salvos no localStorage
        if (AuthService.isAuthenticated()) {
          const user = AuthService.getCurrentUser();
          const accessToken = AuthService.getAccessToken();
          const refreshToken = localStorage.getItem('refreshToken');

          if (user && accessToken && refreshToken) {
            // Verificar se o token está próximo do vencimento
            if (AuthService.isTokenNearExpiry()) {
              try {
                const response = await AuthService.refreshToken();
                dispatch({
                  type: 'REFRESH_TOKEN_SUCCESS',
                  payload: {
                    user: response.user,
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken,
                  },
                });
              } catch (error) {
                // Se não conseguir renovar, fazer logout
                await logout();
              }
            } else {
              // Token ainda válido, restaurar estado
              dispatch({
                type: 'LOGIN_SUCCESS',
                payload: {
                  user,
                  accessToken,
                  refreshToken,
                },
              });
            }
          } else {
            // Dados incompletos, fazer logout
            await logout();
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        await logout();
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Login
  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await AuthService.login(credentials);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        },
      });

      toast.success('Login realizado com sucesso!');
    } catch (error) {
      console.error('Erro no login:', error);
      
      if (error instanceof ApiError) {
        switch (error.code) {
          case 'INVALID_CREDENTIALS':
            toast.error('Email ou senha incorretos');
            break;
          case 'ACCOUNT_DISABLED':
            toast.error('Sua conta foi desativada. Entre em contato com o administrador.');
            break;
          default:
            toast.error(error.message || 'Erro ao fazer login');
        }
      } else {
        toast.error('Erro interno. Tente novamente.');
      }
      
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Registro
  const register = async (data: RegisterRequest): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await AuthService.register(data);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        },
      });

      toast.success('Conta criada com sucesso!');
    } catch (error) {
      console.error('Erro no registro:', error);
      
      if (error instanceof ApiError) {
        switch (error.code) {
          case 'EMAIL_ALREADY_EXISTS':
            toast.error('Este email já está em uso');
            break;
          case 'WEAK_PASSWORD':
            toast.error('Senha muito fraca. Verifique os requisitos.');
            break;
          default:
            toast.error(error.message || 'Erro ao criar conta');
        }
      } else {
        toast.error('Erro interno. Tente novamente.');
      }
      
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      toast.success('Logout realizado com sucesso');
    }
  };

  // Atualizar perfil
  const updateProfile = async (data: UpdateProfileRequest): Promise<void> => {
    try {
      const updatedUser = await AuthService.updateProfile(data);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      
      if (error instanceof ApiError) {
        toast.error(error.message || 'Erro ao atualizar perfil');
      } else {
        toast.error('Erro interno. Tente novamente.');
      }
      
      throw error;
    }
  };

  // Alterar senha
  const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
    try {
      await AuthService.changePassword(data);
      toast.success('Senha alterada com sucesso!');
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      
      if (error instanceof ApiError) {
        switch (error.code) {
          case 'INCORRECT_CURRENT_PASSWORD':
            toast.error('Senha atual incorreta');
            break;
          case 'WEAK_PASSWORD':
            toast.error('Nova senha muito fraca. Verifique os requisitos.');
            break;
          default:
            toast.error(error.message || 'Erro ao alterar senha');
        }
      } else {
        toast.error('Erro interno. Tente novamente.');
      }
      
      throw error;
    }
  };

  // Renovar token
  const refreshToken = async (): Promise<void> => {
    try {
      const response = await AuthService.refreshToken();
      dispatch({
        type: 'REFRESH_TOKEN_SUCCESS',
        payload: {
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        },
      });
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      await logout();
      throw error;
    }
  };

  // Valor do contexto
  const value: AuthContextType = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook para usar o contexto
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
