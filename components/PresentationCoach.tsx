import React, { useState, useEffect, useRef } from 'react';
import { detectEmotions, loadEmotionModels, EmotionResult, getEngagementMetrics } from '../services/emotionDetection';

export interface CoachFeedback {
  type: 'pace' | 'energy' | 'eye_contact' | 'posture' | 'gestures' | 'clarity' | 'emotion';
  severity: 'good' | 'warning' | 'critical';
  message: string;
  timestamp: number;
}

interface PresentationCoachProps {
  isRecording: boolean;
  stream: MediaStream | null;
  script: string;
  onFeedback?: (feedback: CoachFeedback) => void;
}

export const PresentationCoach: React.FC<PresentationCoachProps> = ({
  isRecording,
  stream,
  script,
  onFeedback
}) => {
  const [score, setScore] = useState(85);
  const [currentFeedback, setCurrentFeedback] = useState<CoachFeedback[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const startTimeRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionResult[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionResult | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    loadEmotionModels().then(() => setModelsLoaded(true)).catch(console.error);
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

  useEffect(() => {
    if (isRecording) {
      startTimeRef.current = Date.now();
      const interval = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setRecordingDuration(0);
      setCurrentFeedback([]);
      setEmotionHistory([]);
    }
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording || !videoRef.current || !modelsLoaded) return;

    const detectInterval = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        try {
          const emotion = await detectEmotions(videoRef.current);
          if (emotion) {
            setCurrentEmotion(emotion);
            setEmotionHistory(prev => [...prev, emotion].slice(-20));

            if (emotion.dominantEmotion === 'sad' || emotion.dominantEmotion === 'angry') {
              const feedback: CoachFeedback = {
                type: 'emotion',
                severity: 'warning',
                message: `Try to maintain a more positive expression`,
                timestamp: recordingDuration
              };
              addFeedback(feedback);
            } else if (emotion.dominantEmotion === 'happy' && emotion.confidence > 0.7) {
              const feedback: CoachFeedback = {
                type: 'emotion',
                severity: 'good',
                message: `Great energy and enthusiasm!`,
                timestamp: recordingDuration
              };
              addFeedback(feedback);
            }
          }
        } catch (error) {
          console.error('Emotion detection error:', error);
        }
      }
    }, 2000);

    return () => clearInterval(detectInterval);
  }, [isRecording, videoRef, modelsLoaded, recordingDuration]);

  useEffect(() => {
    if (!isRecording) return;

    const checkPacing = () => {
      const wordsPerMinute = recordingDuration > 0 ? (wordCount / recordingDuration) * 60 : 0;

      if (wordsPerMinute > 180) {
        const feedback: CoachFeedback = {
          type: 'pace',
          severity: 'warning',
          message: `Speaking ${Math.round(wordsPerMinute)} words/min - slow down slightly`,
          timestamp: recordingDuration
        };
        addFeedback(feedback);
      } else if (wordsPerMinute < 120 && wordsPerMinute > 0) {
        const feedback: CoachFeedback = {
          type: 'pace',
          severity: 'warning',
          message: `Speaking ${Math.round(wordsPerMinute)} words/min - speed up slightly`,
          timestamp: recordingDuration
        };
        addFeedback(feedback);
      }
    };

    const feedbackInterval = setInterval(() => {
      checkPacing();
    }, 5000);

    return () => clearInterval(feedbackInterval);
  }, [isRecording, recordingDuration, wordCount]);

  const addFeedback = (feedback: CoachFeedback) => {
    setCurrentFeedback(prev => {
      const filtered = prev.filter(f => f.type !== feedback.type || f.severity !== feedback.severity);
      const updated = [...filtered, feedback].slice(-3);
      return updated;
    });
    onFeedback?.(feedback);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'good':
        return '🟢';
      case 'warning':
        return '🟡';
      case 'critical':
        return '🔴';
      default:
        return '';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'good':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'critical':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (!isRecording) return null;

  return (
    <>
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
      />
      <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 w-64 z-10">
        <div className="text-center mb-3">
          <div className="text-sm font-semibold text-gray-400 mb-1">Coach Score</div>
          <div className={`text-3xl font-bold ${
            score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {score}
          </div>
        </div>

        {currentEmotion && modelsLoaded && (
          <div className="mb-3 p-2 bg-gray-800/50 rounded text-xs">
            <div className="font-semibold text-gray-300 mb-1">Current Emotion</div>
            <div className="flex items-center gap-2">
              <span className="text-lg capitalize">{currentEmotion.dominantEmotion}</span>
              <span className="text-gray-400">{Math.round(currentEmotion.confidence * 100)}%</span>
            </div>
            {currentEmotion.ageApprox && (
              <div className="text-gray-400 mt-1">
                Age: ~{currentEmotion.ageApprox} | {currentEmotion.gender}
              </div>
            )}
          </div>
        )}

      <div className="space-y-2">
        {currentFeedback.length > 0 ? (
          currentFeedback.map((feedback, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-xs bg-gray-800/50 p-2 rounded"
            >
              <span>{getSeverityIcon(feedback.severity)}</span>
              <div className="flex-1">
                <div className={`font-semibold ${getSeverityColor(feedback.severity)}`}>
                  {feedback.type.toUpperCase().replace('_', ' ')}
                </div>
                <div className="text-gray-300">{feedback.message}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span className="text-gray-400">Good eye contact</span>
            </div>
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span className="text-gray-400">Clear speech</span>
            </div>
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span className="text-gray-400">Good posture</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
        <div>Duration: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</div>
        {emotionHistory.length > 0 && (
          <div className="mt-2">
            <div className="text-gray-500">Emotion Samples: {emotionHistory.length}</div>
            {modelsLoaded ? (
              <div className="text-green-400">✓ AI Models Loaded</div>
            ) : (
              <div className="text-yellow-400">⏳ Loading Models...</div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
};
