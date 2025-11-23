import React, { useState, useEffect } from 'react';
import { getUserQueuedRequests, apiQueue } from '../services/apiQueueService';

interface RateLimitNotificationProps {
  onClose?: () => void;
}

export const RateLimitNotification: React.FC<RateLimitNotificationProps> = ({ onClose }) => {
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const checkQueue = async () => {
      const status = await apiQueue.getQueueStatus();
      setQueueStatus(status);

      if (status.pending > 0 || status.processing > 0) {
        setShow(true);
      } else {
        setShow(false);
      }
    };

    checkQueue();
    const interval = setInterval(checkQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!show || !queueStatus) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 border border-yellow-500 rounded-lg p-4 shadow-xl max-w-md z-50 animate-fadeIn">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⏳</span>
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">API Requests Queued</h3>
          <p className="text-gray-300 text-sm mb-2">
            Due to API rate limits, some requests have been queued and will be processed automatically.
          </p>
          <div className="space-y-1 text-xs">
            {queueStatus.pending > 0 && (
              <div className="text-gray-400">
                <span className="font-semibold text-yellow-400">{queueStatus.pending}</span> pending
              </div>
            )}
            {queueStatus.processing > 0 && (
              <div className="text-gray-400">
                <span className="font-semibold text-blue-400">{queueStatus.processing}</span> processing
              </div>
            )}
            {queueStatus.completed > 0 && (
              <div className="text-gray-400">
                <span className="font-semibold text-green-400">{queueStatus.completed}</span> completed
              </div>
            )}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        )}
      </div>
      <div className="mt-3 w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-yellow-500 to-blue-500 h-2 rounded-full transition-all duration-500 animate-pulse"
          style={{
            width: queueStatus.processing > 0 ? '50%' : '20%'
          }}
        />
      </div>
    </div>
  );
};

export const RateLimitBanner: React.FC<{
  message: string;
  retryAfter?: number;
  onDismiss?: () => void;
}> = ({ message, retryAfter, onDismiss }) => {
  const [timeLeft, setTimeLeft] = useState(retryAfter || 0);

  useEffect(() => {
    if (!retryAfter) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onDismiss) onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [retryAfter, onDismiss]);

  return (
    <div className="bg-orange-900/50 border border-orange-700 text-orange-300 px-4 py-3 rounded-lg mb-4 animate-fadeIn">
      <div className="flex items-start gap-3">
        <span className="text-xl">⚠️</span>
        <div className="flex-1">
          <p className="font-semibold mb-1">Rate Limit Reached</p>
          <p className="text-sm">{message}</p>
          {timeLeft > 0 && (
            <p className="text-xs mt-2 text-orange-400">
              Your request has been queued. Retry available in {timeLeft}s
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-orange-400 hover:text-orange-300 text-xl"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
