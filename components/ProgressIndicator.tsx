import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ProgressItem {
  label: string;
  completed: boolean;
  recommended?: boolean;
}

interface ProgressIndicatorProps {
  script: string;
  videoRecorded: boolean;
  presentationScore?: number;
  hasChapters?: boolean;
  hasSEO?: boolean;
  hasTeamApproval?: boolean;
  hasEngagementPrediction?: boolean;
  onAction?: (action: string) => void;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  script,
  videoRecorded,
  presentationScore,
  hasChapters,
  hasSEO,
  hasTeamApproval,
  hasEngagementPrediction,
  onAction
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();

  const items: ProgressItem[] = [
    {
      label: 'Script written',
      completed: !!script && script.trim().length > 0
    },
    {
      label: 'Video recorded',
      completed: videoRecorded
    },
    {
      label: `Presentation score: ${presentationScore || 0}/100`,
      completed: !!presentationScore && presentationScore >= 70
    },
    {
      label: 'Generate chapters',
      completed: !!hasChapters,
      recommended: videoRecorded && !hasChapters
    },
    {
      label: 'Optimize SEO metadata',
      completed: !!hasSEO,
      recommended: !!script && !hasSEO
    },
    {
      label: 'Get team approval',
      completed: !!hasTeamApproval,
      recommended: false
    },
    {
      label: 'Predict engagement',
      completed: !!hasEngagementPrediction,
      recommended: videoRecorded && !hasEngagementPrediction
    }
  ];

  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-gray-800 border-2 border-yellow-400 text-white rounded-full px-6 py-3 shadow-lg hover:bg-gray-700 transition-all flex items-center gap-3"
        >
          <div className="w-12 h-12 relative">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-gray-600"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - percentage / 100)}`}
                className="text-yellow-400 transition-all duration-500"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
              {percentage}%
            </div>
          </div>
          <span className="font-semibold">Video Optimization</span>
        </button>
      ) : (
        <div className="bg-gray-800 border-2 border-yellow-400 rounded-lg shadow-2xl w-80 overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Video Optimization Progress</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Completion</span>
                <span className="text-sm font-bold text-white">{percentage}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded ${
                    item.recommended ? 'bg-yellow-900/20 border border-yellow-700/50' : ''
                  }`}
                >
                  <div className="w-5 h-5 flex-shrink-0">
                    {item.completed ? (
                      <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : item.recommended ? (
                      <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm flex-1 ${
                    item.completed ? 'text-gray-300' : 'text-gray-400'
                  }`}>
                    {item.label}
                  </span>
                  {item.recommended && !item.completed && (
                    <span className="text-xs text-yellow-400 font-semibold">Recommended</span>
                  )}
                </div>
              ))}
            </div>

            {percentage < 100 && (
              <button
                onClick={() => onAction?.('continue')}
                className="w-full mt-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-300 transition-colors"
              >
                Continue Optimizing
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
