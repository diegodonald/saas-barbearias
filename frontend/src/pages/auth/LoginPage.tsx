import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLoginForm, LoginFormData } from '@/hooks/useForm';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    getFieldError,
    isSubmitting,
  } = useLoginForm();

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (error) {
      // Erro já tratado no contexto
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-secondary-900">
            SaaS Barbearias
          </h1>
          <h2 className="mt-6 text-2xl font-semibold text-secondary-900">
            Faça login na sua conta
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            Ou{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              crie uma nova conta
            </Link>
          </p>
        </div>

        {/* Formulário */}
        <Card variant="elevated" padding="lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Input
                {...register('email')}
                type="email"
                label="Email"
                placeholder="seu@email.com"
                leftIcon={<Mail size={18} />}
                error={getFieldError('email')}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <Input
                {...register('password')}
                type="password"
                label="Senha"
                placeholder="••••••••"
                leftIcon={<Lock size={18} />}
                isPassword
                error={getFieldError('password')}
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-secondary-700">
                  Lembrar de mim
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              leftIcon={!isSubmitting && <LogIn size={18} />}
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </Card>

        {/* Links adicionais */}
        <div className="text-center">
          <p className="text-xs text-secondary-500">
            Ao continuar, você concorda com nossos{' '}
            <Link
              to="/terms"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link
              to="/privacy"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
