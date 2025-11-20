import React, { useState, useEffect } from 'react';

export interface TriggerAction {
  label: string;
  action: () => void;
  primary?: boolean;
}

interface SmartTriggerProps {
  show: boolean;
  title: string;
  message: string;
  actions: TriggerAction[];
  onDismiss: () => void;
  type?: 'success' | 'warning' | 'info';
}

export const SmartTrigger: React.FC<SmartTriggerProps> = ({
  show,
  title,
  message,
  actions,
  onDismiss,
  type = 'info'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
    }
  }, [show]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  if (!show && !isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-gray-800 border-2 ${
          type === 'success'
            ? 'border-green-500'
            : type === 'warning'
            ? 'border-yellow-500'
            : 'border-blue-500'
        } rounded-lg shadow-2xl max-w-md w-full transform transition-all ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            {getIcon()}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex gap-3 justify-end">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.action();
                  handleDismiss();
                }}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  action.primary
                    ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const useSmartTrigger = () => {
  const [trigger, setTrigger] = useState<{
    show: boolean;
    title: string;
    message: string;
    actions: TriggerAction[];
    type?: 'success' | 'warning' | 'info';
  }>({
    show: false,
    title: '',
    message: '',
    actions: [],
    type: 'info'
  });

  const showTrigger = (
    title: string,
    message: string,
    actions: TriggerAction[],
    type: 'success' | 'warning' | 'info' = 'info'
  ) => {
    setTrigger({ show: true, title, message, actions, type });
  };

  const hideTrigger = () => {
    setTrigger(prev => ({ ...prev, show: false }));
  };

  return { trigger, showTrigger, hideTrigger };
};
