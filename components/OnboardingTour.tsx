import React, { useState, useEffect } from 'react';
import {
  getOnboardingProgress,
  updateOnboardingStep,
  completeTour,
  skipOnboarding,
  initializeOnboarding
} from '../services/onboardingService';

interface TourStep {
  title: string;
  description: string;
  target?: string;
  highlight?: string;
  actionLabel?: string;
  image?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to AI Video Email! 🎉',
    description: 'Create personalized AI-powered video emails that get responses. Let\'s take a quick tour to show you the essentials.',
    actionLabel: 'Start Tour'
  },
  {
    title: 'Step 1: Create Your Script',
    description: 'Start with a script using our templates or AI prompt builder. Templates are pre-written for sales pitches, thank you messages, and more.',
    target: 'script-editor',
    actionLabel: 'Next: Record Video'
  },
  {
    title: 'Step 2: Record Your Video',
    description: 'Click record and deliver your message. Our AI presentation coach gives you real-time feedback on pace, energy, and eye contact.',
    target: 'video-recorder',
    actionLabel: 'Next: AI Features'
  },
  {
    title: 'Step 3: Enhance with AI',
    description: 'Use AI to remove backgrounds, generate chapters, optimize SEO, and predict engagement. These features make your videos professional and effective.',
    target: 'ai-features',
    actionLabel: 'Next: Send Emails'
  },
  {
    title: 'Step 4: Send Personalized Emails',
    description: 'Create campaigns and send personalized video emails at scale. Track opens, views, and responses in real-time.',
    target: 'email-composer',
    actionLabel: 'Next: Analytics'
  },
  {
    title: 'Step 5: Track Your Success',
    description: 'View analytics to see engagement rates, completion rates, and AI-generated insights to improve your videos.',
    target: 'analytics',
    actionLabel: 'Complete Tour'
  },
  {
    title: 'You\'re All Set! 🚀',
    description: 'You can always access help by clicking the ? icon in the header. Press Shift+? to see keyboard shortcuts. Ready to create your first video?',
    actionLabel: 'Get Started'
  }
];

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: '50%', left: '50%' });

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      updateOnboardingStep(currentStep);
    }
  }, [currentStep, isVisible]);

  const loadProgress = async () => {
    await initializeOnboarding();
    const progress = await getOnboardingProgress();

    if (progress && !progress.tour_completed && !progress.skip_onboarding) {
      setCurrentStep(progress.current_step);
      setIsVisible(true);
    }
  };

  const updatePosition = () => {
    const step = TOUR_STEPS[currentStep];
    if (step.target) {
      const element = document.querySelector(`[data-tour="${step.target}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        setPosition({
          top: `${rect.bottom + 20}px`,
          left: `${rect.left + rect.width / 2}px`
        });

        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    setPosition({ top: '50%', left: '50%' });
  };

  const handleNext = async () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    await completeTour();
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = async () => {
    await skipOnboarding();
    setIsVisible(false);
    onSkip();
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const isCentered = !step.target;

  return (
    <>
      {step.target && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          style={{ backdropFilter: 'blur(2px)' }}
          onClick={handleSkip}
        >
          {step.highlight && (
            <div
              className="absolute border-4 border-blue-500 rounded-lg pointer-events-none"
              style={{
                top: position.top,
                left: position.left,
                animation: 'pulse 2s infinite'
              }}
            />
          )}
        </div>
      )}

      <div
        className={`fixed z-50 bg-white rounded-lg shadow-2xl max-w-md w-full transition-all duration-300 ${
          isCentered ? 'transform -translate-x-1/2 -translate-y-1/2' : 'transform -translate-x-1/2'
        }`}
        style={isCentered ? { top: '50%', left: '50%' } : position}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {step.title}
              </h2>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-1">
                  {TOUR_STEPS.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 rounded-full transition-all ${
                        index === currentStep
                          ? 'w-8 bg-blue-600'
                          : index < currentStep
                          ? 'w-2 bg-blue-400'
                          : 'w-2 bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  {currentStep + 1} of {TOUR_STEPS.length}
                </span>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Skip tour"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-gray-700 mb-6 leading-relaxed">
            {step.description}
          </p>

          {isFirstStep && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Quick Tour (2 minutes)</p>
                  <p>We'll show you the 5 key steps to create and send your first video email.</p>
                </div>
              </div>
            </div>
          )}

          {isLastStep && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">Achievement Unlocked!</p>
                  <p>Quick Learner - You completed the onboarding tour</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              {!isFirstStep && (
                <button
                  onClick={handleBack}
                  className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  ← Back
                </button>
              )}
            </div>

            <div className="flex gap-3">
              {!isLastStep && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Skip Tour
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                {step.actionLabel || 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  );
};
