import React from 'react';
import { clsx } from 'clsx';
import { AlertCircle, XCircle, AlertTriangle } from 'lucide-react';

export interface ErrorMessageProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
  className?: string;
  showIcon?: boolean;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  type = 'error',
  className,
  showIcon = true,
  onDismiss,
}) => {
  const typeClasses = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconClasses = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  };

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className={clsx('w-5 h-5', iconClasses[type])} />;
      case 'info':
        return <AlertCircle className={clsx('w-5 h-5', iconClasses[type])} />;
      default:
        return <XCircle className={clsx('w-5 h-5', iconClasses[type])} />;
    }
  };

  return (
    <div
      className={clsx(
        'flex items-start gap-3 p-4 border rounded-lg',
        typeClasses[type],
        className
      )}
    >
      {showIcon && getIcon()}
      <div className='flex-1'>
        <p className='text-sm font-medium'>{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className='flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600'
        >
          <XCircle className='w-4 h-4' />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
