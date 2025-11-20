import React from 'react';
import { Take } from './VideoRecorder';

interface TakeComparisonProps {
  takes: Take[];
  onSelectTake: (take: Take) => void;
  onClose: () => void;
}

export const TakeComparison: React.FC<TakeComparisonProps> = ({
  takes,
  onSelectTake,
  onClose
}) => {
  const completedTakes = takes.filter(t => t.analysis && t.status === 'complete');

  if (completedTakes.length === 0) {
    return null;
  }

  const bestTake = completedTakes.reduce((best, current) =>
    (current.analysis?.score || 0) > (best.analysis?.score || 0) ? current : best
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBorderColor = (score: number) => {
    if (score >= 80) return 'border-green-400';
    if (score >= 60) return 'border-yellow-400';
    return 'border-red-400';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Compare Your Takes</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedTakes.map((take, index) => {
              const isBest = take.id === bestTake.id;
              const score = take.analysis?.score || 0;

              return (
                <div
                  key={take.id}
                  className={`bg-gray-700 rounded-lg overflow-hidden border-2 ${
                    isBest ? getScoreBorderColor(score) : 'border-transparent'
                  } relative`}
                >
                  {isBest && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 px-2 py-1 rounded text-xs font-bold z-10">
                      BEST
                    </div>
                  )}

                  <div className="aspect-video bg-gray-900 relative">
                    <video
                      src={take.url}
                      className="w-full h-full object-cover"
                      controls
                    />
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-white">
                        Take {index + 1}
                      </h3>
                      <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                        {score}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            score >= 80 ? 'bg-green-400' : score >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>

                    {take.analysis && (
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-300">{take.analysis.justification}</p>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        onSelectTake(take);
                        onClose();
                      }}
                      className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                        isBest
                          ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
                          : 'bg-gray-600 text-white hover:bg-gray-500'
                      }`}
                    >
                      {isBest ? 'Use This Take' : 'Select'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Recommendations</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span>Use Take {completedTakes.indexOf(bestTake) + 1} for the best overall quality</span>
              </li>
              {completedTakes.some(t => (t.analysis?.score || 0) < 60) && (
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>Consider re-recording takes with scores below 60</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span>Review the justification for each take to understand what worked well</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
