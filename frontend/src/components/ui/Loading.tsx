import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  text,
  fullScreen = false,
  className,
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

  const renderSpinner = () => (
    <Loader2
      className={clsx('animate-spin text-primary-600', sizeClasses[size])}
    />
  );

  const renderDots = () => (
    <div className='flex space-x-1'>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className={clsx(
            'bg-primary-600 rounded-full animate-pulse',
            size === 'sm' && 'w-1 h-1',
            size === 'md' && 'w-2 h-2',
            size === 'lg' && 'w-3 h-3',
            size === 'xl' && 'w-4 h-4'
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div
      className={clsx(
        'bg-primary-600 rounded-full animate-pulse',
        sizeClasses[size]
      )}
    />
  );

  const renderVariant = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      default:
        return renderSpinner();
    }
  };

  const content = (
    <div
      className={clsx(
        'flex flex-col items-center justify-center gap-3',
        className
      )}
    >
      {renderVariant()}
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

  if (fullScreen) {
    return (
      <div className='fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center'>
        {content}
      </div>
    );
  }

  return content;
};

// Componente de Loading para páginas
export const PageLoading: React.FC<{ text?: string }> = ({
  text = 'Carregando...',
}) => (
  <div className='min-h-screen flex items-center justify-center'>
    <Loading size='lg' text={text} />
  </div>
);

// Componente de Loading para seções
export const SectionLoading: React.FC<{
  text?: string;
  className?: string;
}> = ({ text = 'Carregando...', className }) => (
  <div className={clsx('py-12 flex items-center justify-center', className)}>
    <Loading size='md' text={text} />
  </div>
);

// Componente de Loading inline
export const InlineLoading: React.FC<{ text?: string; className?: string }> = ({
  text,
  className,
}) => (
  <div className={clsx('flex items-center gap-2', className)}>
    <Loading size='sm' />
    {text && <span className='text-sm text-secondary-600'>{text}</span>}
  </div>
);

export default Loading;
