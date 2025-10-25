import React, { useEffect, useState } from 'react';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  show?: boolean;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  show = true
}) => {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  const getTypeStyles = () => {
    const styles = {
      success: {
        bg: 'bg-success-50',
        border: 'border-success-200',
        icon: 'text-success-600',
        title: 'text-success-800',
        message: 'text-success-700',
        iconSvg: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      error: {
        bg: 'bg-danger-50',
        border: 'border-danger-200',
        icon: 'text-danger-600',
        title: 'text-danger-800',
        message: 'text-danger-700',
        iconSvg: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      warning: {
        bg: 'bg-warning-50',
        border: 'border-warning-200',
        icon: 'text-warning-600',
        title: 'text-warning-800',
        message: 'text-warning-700',
        iconSvg: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      },
      info: {
        bg: 'bg-primary-50',
        border: 'border-primary-200',
        icon: 'text-primary-600',
        title: 'text-primary-800',
        message: 'text-primary-700',
        iconSvg: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      }
    };

    return styles[type];
  };

  const styles = getTypeStyles();

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${isVisible ? 'animate-slide-down' : 'animate-slide-up'}`}>
      <div className={`${styles.bg} ${styles.border} border rounded-xl shadow-medium p-4`}>
        <div className="flex items-start">
          <div className={`${styles.icon} flex-shrink-0 mr-3`}>
            {styles.iconSvg}
          </div>
          <div className="flex-1">
            <h4 className={`${styles.title} font-semibold text-sm`}>{title}</h4>
            <p className={`${styles.message} text-sm mt-1`}>{message}</p>
          </div>
          <button
            onClick={handleClose}
            className={`${styles.icon} hover:opacity-70 transition-opacity ml-2`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
