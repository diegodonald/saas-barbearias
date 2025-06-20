import React, { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

// Card principal
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hover = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = ['rounded-xl transition-all duration-200'];

    const variantClasses = {
      default: 'bg-white',
      outlined: 'bg-white border border-secondary-200',
      elevated: 'bg-white shadow-soft',
    };

    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const hoverClasses = hover
      ? 'hover:shadow-medium hover:-translate-y-0.5 cursor-pointer'
      : '';

    const classes = clsx(
      baseClasses,
      variantClasses[variant],
      paddingClasses[padding],
      hoverClasses,
      className
    );

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, children, ...props }, ref) => {
    const classes = clsx('flex items-start justify-between mb-4', className);

    return (
      <div ref={ref} className={classes} {...props}>
        <div className='flex-1 min-w-0'>
          {title && (
            <h3 className='text-lg font-semibold text-secondary-900 truncate'>
              {title}
            </h3>
          )}
          {subtitle && (
            <p className='mt-1 text-sm text-secondary-500 truncate'>
              {subtitle}
            </p>
          )}
          {children}
        </div>
        {action && <div className='flex-shrink-0 ml-4'>{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Card Content
const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    const classes = clsx('text-secondary-700', className);

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

// Card Footer
const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    const classes = clsx(
      'mt-6 pt-4 border-t border-secondary-100 flex items-center justify-between',
      className
    );

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

// Exportar componentes
export { Card, CardHeader, CardContent, CardFooter };
export default Card;
