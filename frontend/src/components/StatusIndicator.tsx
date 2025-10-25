import React from 'react';

interface StatusIndicatorProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  size = 'md', 
  showText = true,
  className = '' 
}) => {
  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { color: string; bgColor: string; textColor: string; icon: string }> = {
      'Focused': {
        color: 'success',
        bgColor: 'bg-success-100',
        textColor: 'text-success-800',
        icon: '✓'
      },
      'Normal': {
        color: 'success',
        bgColor: 'bg-success-100',
        textColor: 'text-success-800',
        icon: '✓'
      },
      'Distracted': {
        color: 'warning',
        bgColor: 'bg-warning-100',
        textColor: 'text-warning-800',
        icon: '⚠'
      },
      'No face detected': {
        color: 'danger',
        bgColor: 'bg-danger-100',
        textColor: 'text-danger-800',
        icon: '👤'
      },
      'Multiple faces detected': {
        color: 'danger',
        bgColor: 'bg-danger-100',
        textColor: 'text-danger-800',
        icon: '👥'
      },
      'Device Detected': {
        color: 'danger',
        bgColor: 'bg-danger-100',
        textColor: 'text-danger-800',
        icon: '📱'
      },
      'Not Started': {
        color: 'secondary',
        bgColor: 'bg-secondary-100',
        textColor: 'text-secondary-800',
        icon: '⏳'
      },
      'Connecting...': {
        color: 'primary',
        bgColor: 'bg-primary-100',
        textColor: 'text-primary-800',
        icon: '🔄'
      },
      'Connection Error': {
        color: 'danger',
        bgColor: 'bg-danger-100',
        textColor: 'text-danger-800',
        icon: '❌'
      }
    };

    return statusMap[status] || {
      color: 'secondary',
      bgColor: 'bg-secondary-100',
      textColor: 'text-secondary-800',
      icon: '?'
    };
  };

  const config = getStatusConfig(status);
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <div className={`${config.bgColor} ${config.textColor} ${sizeClasses[size]} rounded-full font-medium border border-current/20`}>
        <span className="mr-1">{config.icon}</span>
        {showText && status}
      </div>
    </div>
  );
};

export default StatusIndicator;
