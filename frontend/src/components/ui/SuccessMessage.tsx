import React from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessMessageProps {
  message: string;
  onClose?: () => void;
  className?: string;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  onClose,
  className = '',
}) => {
  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <p className="text-sm text-green-800">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 text-green-600 hover:text-green-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
