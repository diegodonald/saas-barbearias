import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, UserPlus, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRegisterForm, RegisterFormData } from '@/hooks/useForm';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

const RegisterPage: React.FC = () => {
  const { register: registerUser, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    getFieldError,
    isSubmitting,
    watch,
  } = useRegisterForm();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, terms, ...registerData } = data;
      await registerUser(registerData);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      // Erro já tratado no contexto
    }
  };

  // Validação visual da senha
  const passwordRequirements = [
    { label: 'Pelo menos 8 caracteres', test: (pwd: string) => pwd.length >= 8 },
    { label: 'Uma letra minúscula', test: (pwd: string) => /[a-z]/.test(pwd) },
    { label: 'Uma letra maiúscula', test: (pwd: string) => /[A-Z]/.test(pwd) },
    { label: 'Um número', test: (pwd: string) => /\d/.test(pwd) },
    { label: 'Um caractere especial', test: (pwd: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd) },
  ];

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
            Crie sua conta
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            Ou{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              faça login na sua conta existente
            </Link>
          </p>
        </div>

        {/* Formulário */}
        <Card variant="elevated" padding="lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Input
                {...register('name')}
                type="text"
                label="Nome completo"
                placeholder="Seu nome completo"
                leftIcon={<User size={18} />}
                error={getFieldError('name')}
                autoComplete="name"
                autoFocus
              />
            </div>

            <div>
              <Input
                {...register('email')}
                type="email"
                label="Email"
                placeholder="seu@email.com"
                leftIcon={<Mail size={18} />}
                error={getFieldError('email')}
                autoComplete="email"
              />
            </div>

            <div>
              <Input
                {...register('phone')}
                type="tel"
                label="Telefone (opcional)"
                placeholder="(11) 99999-9999"
                leftIcon={<Phone size={18} />}
                error={getFieldError('phone')}
                autoComplete="tel"
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
                autoComplete="new-password"
              />
              
              {/* Indicadores de força da senha */}
              {password && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-secondary-700">Requisitos da senha:</p>
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check 
                        size={12} 
                        className={req.test(password) ? 'text-success-600' : 'text-secondary-300'} 
                      />
                      <span className={`text-xs ${req.test(password) ? 'text-success-600' : 'text-secondary-500'}`}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Input
                {...register('confirmPassword')}
                type="password"
                label="Confirmar senha"
                placeholder="••••••••"
                leftIcon={<Lock size={18} />}
                isPassword
                error={getFieldError('confirmPassword')}
                autoComplete="new-password"
              />
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  {...register('terms')}
                  id="terms"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-secondary-700">
                  Eu concordo com os{' '}
                  <Link
                    to="/terms"
                    className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                    target="_blank"
                  >
                    Termos de Uso
                  </Link>{' '}
                  e{' '}
                  <Link
                    to="/privacy"
                    className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                    target="_blank"
                  >
                    Política de Privacidade
                  </Link>
                </label>
                {getFieldError('terms') && (
                  <p className="mt-1 text-xs text-error-600">{getFieldError('terms')}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              leftIcon={!isSubmitting && <UserPlus size={18} />}
            >
              {isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>
        </Card>

        {/* Links adicionais */}
        <div className="text-center">
          <p className="text-xs text-secondary-500">
            Ao criar uma conta, você concorda em receber comunicações sobre nossos serviços.
            Você pode cancelar a qualquer momento.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
