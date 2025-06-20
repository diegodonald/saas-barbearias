import React, { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      isPassword = false,
      fullWidth = true,
      type = 'text',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const baseClasses = [
      'block rounded-lg border px-3 py-2 text-sm transition-all duration-200',
      'placeholder:text-secondary-400',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:cursor-not-allowed disabled:opacity-50',
    ];

    const stateClasses = error
      ? [
          'border-error-300 text-error-900',
          'focus:border-error-500 focus:ring-error-500',
        ]
      : [
          'border-secondary-300 text-secondary-900',
          'focus:border-primary-500 focus:ring-primary-500',
          'hover:border-secondary-400',
        ];

    const paddingClasses = [
      leftIcon && 'pl-10',
      (rightIcon || isPassword) && 'pr-10',
    ].filter(Boolean);

    const widthClasses = fullWidth ? 'w-full' : '';

    const inputClasses = clsx(
      baseClasses,
      stateClasses,
      paddingClasses,
      widthClasses,
      className
    );

    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className={clsx(
              'mb-1 block text-sm font-medium',
              error ? 'text-error-700' : 'text-secondary-700'
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className={clsx('text-secondary-400', error && 'text-error-400')}>
                {leftIcon}
              </span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={inputClasses}
            {...props}
          />

          {(rightIcon || isPassword) && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {isPassword ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={clsx(
                    'text-secondary-400 hover:text-secondary-600 transition-colors',
                    error && 'text-error-400 hover:text-error-600'
                  )}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              ) : (
                <span className={clsx('text-secondary-400', error && 'text-error-400')}>
                  {rightIcon}
                </span>
              )}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <p
            className={clsx(
              'mt-1 text-xs',
              error ? 'text-error-600' : 'text-secondary-500'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
