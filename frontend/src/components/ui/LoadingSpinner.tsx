import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center gap-2',
        className
      )}
    >
      <Loader2
        className={clsx('animate-spin text-primary-600', sizeClasses[size])}
      />
      {text && (
        <p
          className={clsx(
            'text-secondary-600 font-medium',
            textSizeClasses[size]
          )}
        >
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
