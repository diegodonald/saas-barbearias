import { useForm as useReactHookForm, UseFormProps, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Esquemas de validação para formulários de autenticação
export const authSchemas = {
  login: z.object({
    email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
    password: z.string().min(1, 'Senha é obrigatória'),
  }),

  register: z.object({
    name: z
      .string()
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(100, 'Nome deve ter no máximo 100 caracteres')
      .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
    email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
    password: z
      .string()
      .min(8, 'Senha deve ter pelo menos 8 caracteres')
      .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
      .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
      .regex(/\d/, 'Senha deve conter pelo menos um número')
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Senha deve conter pelo menos um caractere especial'),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
    phone: z
      .string()
      .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX')
      .optional()
      .or(z.literal('')),
    terms: z.boolean().refine(val => val === true, 'Você deve aceitar os termos de uso'),
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
  }),

  forgotPassword: z.object({
    email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  }),

  resetPassword: z.object({
    password: z
      .string()
      .min(8, 'Senha deve ter pelo menos 8 caracteres')
      .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
      .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
      .regex(/\d/, 'Senha deve conter pelo menos um número')
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Senha deve conter pelo menos um caractere especial'),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z
      .string()
      .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
      .regex(/[a-z]/, 'Nova senha deve conter pelo menos uma letra minúscula')
      .regex(/[A-Z]/, 'Nova senha deve conter pelo menos uma letra maiúscula')
      .regex(/\d/, 'Nova senha deve conter pelo menos um número')
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Nova senha deve conter pelo menos um caractere especial'),
    confirmNewPassword: z.string().min(1, 'Confirmação da nova senha é obrigatória'),
  }).refine(data => data.newPassword === data.confirmNewPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmNewPassword'],
  }),

  updateProfile: z.object({
    name: z
      .string()
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(100, 'Nome deve ter no máximo 100 caracteres')
      .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
    phone: z
      .string()
      .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX')
      .optional()
      .or(z.literal('')),
    avatar: z.string().url('URL do avatar inválida').optional().or(z.literal('')),
  }),
};

// Tipos inferidos dos esquemas
export type LoginFormData = z.infer<typeof authSchemas.login>;
export type RegisterFormData = z.infer<typeof authSchemas.register>;
export type ForgotPasswordFormData = z.infer<typeof authSchemas.forgotPassword>;
export type ResetPasswordFormData = z.infer<typeof authSchemas.resetPassword>;
export type ChangePasswordFormData = z.infer<typeof authSchemas.changePassword>;
export type UpdateProfileFormData = z.infer<typeof authSchemas.updateProfile>;

// Hook personalizado para formulários com validação Zod
export function useForm<T extends FieldValues>(
  schema: z.ZodSchema<T>,
  options?: Omit<UseFormProps<T>, 'resolver'>
) {
  const form = useReactHookForm<T>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    ...options,
  });

  // Função helper para obter erro de um campo
  const getFieldError = (fieldName: Path<T>) => {
    const error = form.formState.errors[fieldName];
    return error?.message as string | undefined;
  };

  // Função helper para verificar se um campo tem erro
  const hasFieldError = (fieldName: Path<T>) => {
    return !!form.formState.errors[fieldName];
  };

  // Função helper para verificar se o formulário é válido
  const isValid = form.formState.isValid;

  // Função helper para verificar se o formulário foi modificado
  const isDirty = form.formState.isDirty;

  // Função helper para verificar se está enviando
  const isSubmitting = form.formState.isSubmitting;

  return {
    ...form,
    getFieldError,
    hasFieldError,
    isValid,
    isDirty,
    isSubmitting,
  };
}

// Hooks específicos para cada formulário
export const useLoginForm = (options?: Omit<UseFormProps<LoginFormData>, 'resolver'>) =>
  useForm(authSchemas.login, options);

export const useRegisterForm = (options?: Omit<UseFormProps<RegisterFormData>, 'resolver'>) =>
  useForm(authSchemas.register, options);

export const useForgotPasswordForm = (options?: Omit<UseFormProps<ForgotPasswordFormData>, 'resolver'>) =>
  useForm(authSchemas.forgotPassword, options);

export const useResetPasswordForm = (options?: Omit<UseFormProps<ResetPasswordFormData>, 'resolver'>) =>
  useForm(authSchemas.resetPassword, options);

export const useChangePasswordForm = (options?: Omit<UseFormProps<ChangePasswordFormData>, 'resolver'>) =>
  useForm(authSchemas.changePassword, options);

export const useUpdateProfileForm = (options?: Omit<UseFormProps<UpdateProfileFormData>, 'resolver'>) =>
  useForm(authSchemas.updateProfile, options);
