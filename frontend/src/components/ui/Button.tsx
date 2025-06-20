import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'active:scale-95',
    ];

    const variantClasses = {
      primary: [
        'bg-primary-600 text-white shadow-sm',
        'hover:bg-primary-700 focus:ring-primary-500',
        'disabled:hover:bg-primary-600',
      ],
      secondary: [
        'bg-secondary-100 text-secondary-900 shadow-sm',
        'hover:bg-secondary-200 focus:ring-secondary-500',
        'disabled:hover:bg-secondary-100',
      ],
      outline: [
        'border border-secondary-300 bg-white text-secondary-700 shadow-sm',
        'hover:bg-secondary-50 focus:ring-primary-500',
        'disabled:hover:bg-white',
      ],
      ghost: [
        'text-secondary-700',
        'hover:bg-secondary-100 focus:ring-primary-500',
        'disabled:hover:bg-transparent',
      ],
      danger: [
        'bg-error-600 text-white shadow-sm',
        'hover:bg-error-700 focus:ring-error-500',
        'disabled:hover:bg-error-600',
      ],
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
    };

    const widthClasses = fullWidth ? 'w-full' : '';

    const classes = clsx(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      widthClasses,
      className
    );

    const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 size={iconSize} className="animate-spin" />
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}
        
        {children && <span>{children}</span>}
        
        {!isLoading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
