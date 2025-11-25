import React, { useState, useRef, useEffect } from 'react';
import { logHelpInteraction, markFeatureDiscovered } from '../services/onboardingService';

interface FeatureTooltipProps {
  title: string;
  description: string;
  featureName: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  shortcut?: string;
  learnMoreUrl?: string;
  showBadge?: 'new' | 'popular' | 'advanced';
  alwaysShow?: boolean;
}

export const FeatureTooltip: React.FC<FeatureTooltipProps> = ({
  title,
  description,
  featureName,
  children,
  position = 'top',
  shortcut,
  learnMoreUrl,
  showBadge,
  alwaysShow = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);
  const timeoutRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
      if (!hasBeenViewed) {
        setHasBeenViewed(true);
        logHelpInteraction('tooltip_view', featureName);
        markFeatureDiscovered(featureName);
      }
    }, 500);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-900';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-900';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900';
    }
  };

  const getBadgeColor = () => {
    switch (showBadge) {
      case 'new':
        return 'bg-green-500';
      case 'popular':
        return 'bg-blue-500';
      case 'advanced':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getBadgeText = () => {
    switch (showBadge) {
      case 'new':
        return 'NEW';
      case 'popular':
        return 'POPULAR';
      case 'advanced':
        return 'ADVANCED';
      default:
        return '';
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative inline-block">
        {children}
        {showBadge && (
          <span
            className={`absolute -top-2 -right-2 ${getBadgeColor()} text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-lg`}
            style={{ fontSize: '0.65rem' }}
          >
            {getBadgeText()}
          </span>
        )}
      </div>

      {(isVisible || alwaysShow) && (
        <div
          className={`absolute z-50 ${getPositionClasses()} animate-fadeIn pointer-events-none`}
          style={{ minWidth: '250px', maxWidth: '320px' }}
        >
          <div className="bg-gray-900 text-white rounded-lg shadow-2xl p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-semibold text-sm">{title}</h4>
              {shortcut && (
                <kbd className="px-2 py-1 bg-gray-800 rounded text-xs font-mono border border-gray-700 flex-shrink-0">
                  {shortcut}
                </kbd>
              )}
            </div>

            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              {description}
            </p>

            {learnMoreUrl && (
              <a
                href={learnMoreUrl}
                className="text-blue-400 hover:text-blue-300 text-xs font-medium pointer-events-auto transition-colors inline-flex items-center gap-1"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Learn more
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            )}
          </div>

          <div
            className={`absolute w-0 h-0 border-8 border-transparent ${getArrowClasses()}`}
            style={{ borderWidth: '6px' }}
          />
        </div>
      )}
    </div>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  illustration?: 'video' | 'email' | 'analytics' | 'template';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  illustration
}) => {
  const getIllustration = () => {
    switch (illustration) {
      case 'video':
        return (
          <svg className="w-24 h-24 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'email':
        return (
          <svg className="w-24 h-24 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'analytics':
        return (
          <svg className="w-24 h-24 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'template':
        return (
          <svg className="w-24 h-24 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {illustration ? getIllustration() : icon}

      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>

      <p className="text-gray-600 mb-6 max-w-md leading-relaxed">
        {description}
      </p>

      <div className="flex gap-3">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            {actionLabel}
          </button>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
