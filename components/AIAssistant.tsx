import React, { useState, useEffect } from 'react';
import { getFeatureUsageStats, markFeatureUsed, unlockAchievement, ACHIEVEMENTS } from '../services/onboardingService';

interface AssistantMessage {
  type: 'tip' | 'suggestion' | 'reminder' | 'tutorial' | 'achievement';
  message: string;
  actionLabel?: string;
  action?: () => void;
  tutorialSteps?: string[];
  achievementUnlocked?: string;
}

interface AIAssistantProps {
  currentContext: 'script' | 'recording' | 'editing' | 'composer' | 'idle';
  script?: string;
  isRecording?: boolean;
  hasVideo?: boolean;
  onStartTutorial?: (feature: string) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  currentContext,
  script,
  isRecording,
  hasVideo,
  onStartTutorial
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<AssistantMessage | null>(null);
  const [messageHistory, setMessageHistory] = useState<AssistantMessage[]>([]);
  const [featureStats, setFeatureStats] = useState<Record<string, number>>({});
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [currentTutorial, setCurrentTutorial] = useState<{ feature: string; steps: string[] } | null>(null);

  useEffect(() => {
    loadFeatureStats();
  }, []);

  useEffect(() => {
    const message = getContextualMessage();
    if (message) {
      setCurrentMessage(message);
      setMessageHistory(prev => [...prev, message].slice(-5));
    }
  }, [currentContext, script, isRecording, hasVideo, featureStats]);

  const loadFeatureStats = async () => {
    const stats = await getFeatureUsageStats();
    setFeatureStats(stats);
  };

  const startTutorial = (feature: string, steps: string[]) => {
    setCurrentTutorial({ feature, steps });
    setShowTutorialModal(true);
    if (onStartTutorial) {
      onStartTutorial(feature);
    }
  };

  const suggestUnusedFeature = (): AssistantMessage | null => {
    const unusedFeatures = [
      { key: 'veo_generation', name: 'VEO Video Generation', tutorial: ['Open AI Features panel', 'Click "Generate VEO Background"', 'Enter a prompt describing your scene', 'Select duration and style'] },
      { key: 'seo_optimization', name: 'SEO Optimization', tutorial: ['Open AI Features panel', 'Click "Optimize SEO"', 'Review generated metadata', 'Apply to your video'] },
      { key: 'engagement_prediction', name: 'Engagement Prediction', tutorial: ['Open AI Features panel', 'Click "Predict Engagement"', 'Review insights', 'Apply recommendations'] },
      { key: 'chapters', name: 'Video Chapters', tutorial: ['Open AI Features panel', 'Click "Detect Chapters"', 'Review generated chapters', 'Edit if needed'] }
    ];

    const unused = unusedFeatures.find(f => !featureStats[f.key] || featureStats[f.key] === 0);
    if (unused) {
      return {
        type: 'tutorial',
        message: `Try ${unused.name}! This powerful AI feature can enhance your videos significantly.`,
        actionLabel: 'Show Me How',
        action: () => startTutorial(unused.key, unused.tutorial),
        tutorialSteps: unused.tutorial
      };
    }
    return null;
  };

  const getContextualMessage = (): AssistantMessage | null => {
    if (!script && !isRecording && !hasVideo && featureStats.template_used === undefined) {
      const unused = suggestUnusedFeature();
      if (unused) return unused;
    }

    switch (currentContext) {
      case 'script':
        if (!script || script.trim().length === 0) {
          return {
            type: 'tip',
            message: 'Start by writing a script or using a template. Templates help you create professional videos faster!',
            actionLabel: 'Browse Templates',
            action: () => markFeatureUsed('template_browse')
          };
        }
        if (script && script.split(' ').length < 50) {
          return {
            type: 'suggestion',
            message: 'Your script is quite short. Aim for 120-180 words for a 60-90 second video.'
          };
        }
        if (script && script.split(' ').length > 50 && !featureStats.ai_prompt_builder) {
          return {
            type: 'tutorial',
            message: 'Did you know you can use the AI Prompt Builder to generate better video prompts?',
            actionLabel: 'Try It Now',
            tutorialSteps: ['Click "Prompt Builder"', 'Select a category', 'Customize parameters', 'Generate optimized prompt']
          };
        }
        break;

      case 'recording':
        if (isRecording) {
          return {
            type: 'tip',
            message: 'Maintain eye contact with the camera and speak clearly. Your presentation coach is monitoring your delivery!'
          };
        }
        if (!isRecording && !featureStats.presentation_coach) {
          return {
            type: 'tutorial',
            message: 'Enable Presentation Coach for real-time feedback on your delivery!',
            actionLabel: 'Learn More',
            tutorialSteps: ['Click "Enable Coach" button', 'Record your video', 'Get instant feedback', 'Review suggestions']
          };
        }
        break;

      case 'editing':
        if (hasVideo && !featureStats.chapters) {
          return {
            type: 'suggestion',
            message: 'Consider adding chapters to help viewers navigate your content. Long videos benefit greatly from chapters!',
            actionLabel: 'Generate Chapters',
            action: () => markFeatureUsed('chapters')
          };
        }
        if (hasVideo && !featureStats.seo_optimization) {
          return {
            type: 'tutorial',
            message: 'Optimize your video for search engines with AI-powered SEO!',
            actionLabel: 'Show Me How',
            tutorialSteps: ['Open AI Features', 'Click "Optimize SEO"', 'Review metadata', 'Apply suggestions']
          };
        }
        break;

      case 'composer':
        if (!featureStats.seo_optimization) {
          return {
            type: 'reminder',
            message: 'Before sending, make sure to optimize your SEO metadata and check your engagement prediction.',
            actionLabel: 'Optimize Now'
          };
        }
        if (!featureStats.campaign_created) {
          return {
            type: 'tutorial',
            message: 'Send to multiple recipients at once with campaigns!',
            actionLabel: 'Create Campaign',
            tutorialSteps: ['Click "Campaigns"', 'Create new campaign', 'Upload contacts', 'Send personalized emails']
          };
        }
        break;

      default:
        const unusedFeature = suggestUnusedFeature();
        if (unusedFeature) return unusedFeature;
        return null;
    }
    return null;
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'tip':
        return 'text-blue-400';
      case 'suggestion':
        return 'text-yellow-400';
      case 'reminder':
        return 'text-purple-400';
      case 'tutorial':
        return 'text-green-400';
      case 'achievement':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  if (!currentMessage && messageHistory.length === 0) return null;

  return (
    <>
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed bottom-6 left-6 z-40 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-110 group"
          title="AI Assistant"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          {currentMessage && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
      )}

      {isExpanded && (
        <div className="fixed bottom-6 left-6 z-40 bg-gray-800 border-2 border-gray-700 rounded-lg shadow-2xl w-96 max-h-[500px] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gradient-to-r from-blue-500/10 to-purple-600/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">AI Assistant</h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {currentMessage && (
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 ${getIconColor(currentMessage.type)}`}>
                    {currentMessage.type === 'tip' && (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    )}
                    {currentMessage.type === 'suggestion' && (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                      </svg>
                    )}
                    {currentMessage.type === 'reminder' && (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-gray-400 uppercase mb-1">
                      {currentMessage.type}
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed">
                      {currentMessage.message}
                    </p>
                    {currentMessage.actionLabel && (
                      <button
                        onClick={currentMessage.action}
                        className="mt-3 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {currentMessage.actionLabel} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {messageHistory.length > 1 && (
              <div className="pt-3 border-t border-gray-700">
                <div className="text-xs font-semibold text-gray-400 mb-2">Recent Tips</div>
                <div className="space-y-2">
                  {messageHistory.slice(0, -1).reverse().slice(0, 3).map((msg, index) => (
                    <div
                      key={index}
                      className="bg-gray-900/50 border border-gray-700 rounded p-2 text-xs text-gray-400"
                    >
                      {msg.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-700 bg-gray-900/50">
            <div className="text-xs text-gray-500 text-center">
              Context-aware tips to help you create better videos
            </div>
          </div>
        </div>
      )}

      {showTutorialModal && currentTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Quick Tutorial
              </h3>
              <button
                onClick={() => setShowTutorialModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="text-gray-700 font-medium">Follow these steps:</p>
              </div>

              <ol className="space-y-3">
                {currentTutorial.steps.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 leading-relaxed pt-0.5">{step}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowTutorialModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Got It
              </button>
              <button
                onClick={() => {
                  setShowTutorialModal(false);
                  markFeatureUsed(currentTutorial.feature);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Try It Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
