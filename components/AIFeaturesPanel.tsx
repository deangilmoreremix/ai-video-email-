import React, { useState } from 'react';
import {
  improveScript,
  analyzeSentiment,
  analyzeTranscriptForQuality,
  getTranscriptWithTimestampsAndFillers,
  recommendAdditionalScenes,
  ScriptImprovement,
  SentimentAnalysis,
  TimedTranscript
} from '../services/geminiService';

interface AIFeaturesPanelProps {
  script: string;
  onScriptUpdate: (newScript: string) => void;
  videoBlob?: Blob;
  aiScenes?: string[];
  onScenesUpdate?: (scenes: string[]) => void;
}

export const AIFeaturesPanel: React.FC<AIFeaturesPanelProps> = ({
  script,
  onScriptUpdate,
  videoBlob,
  aiScenes,
  onScenesUpdate
}) => {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scriptImprovement, setScriptImprovement] = useState<ScriptImprovement | null>(null);
  const [sentiment, setSentiment] = useState<SentimentAnalysis | null>(null);
  const [videoQuality, setVideoQuality] = useState<{ score: number; justification: string } | null>(null);
  const [fillerWords, setFillerWords] = useState<TimedTranscript | null>(null);
  const [recommendedScenes, setRecommendedScenes] = useState<string[]>([]);

  const handleImproveScript = async () => {
    if (!script) {
      setError('Please enter a script first');
      return;
    }
    setLoading(true);
    setError(null);
    setActiveFeature('improve');
    try {
      const result = await improveScript(script);
      setScriptImprovement(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeSentiment = async () => {
    if (!script) {
      setError('Please enter a script first');
      return;
    }
    setLoading(true);
    setError(null);
    setActiveFeature('sentiment');
    try {
      const result = await analyzeSentiment(script);
      setSentiment(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeVideo = async () => {
    if (!videoBlob) {
      setError('Please record a video first');
      return;
    }
    setLoading(true);
    setError(null);
    setActiveFeature('quality');
    try {
      const result = await analyzeTranscriptForQuality(script);
      setVideoQuality(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDetectFillers = async () => {
    if (!videoBlob) {
      setError('Please record a video first');
      return;
    }
    setLoading(true);
    setError(null);
    setActiveFeature('fillers');
    try {
      const result = await getTranscriptWithTimestampsAndFillers(videoBlob);
      setFillerWords(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendScenes = async () => {
    if (!script) {
      setError('Please enter a script first');
      return;
    }
    setLoading(true);
    setError(null);
    setActiveFeature('scenes');
    try {
      const result = await recommendAdditionalScenes(script, aiScenes || []);
      setRecommendedScenes(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyScriptImprovement = () => {
    if (scriptImprovement) {
      onScriptUpdate(scriptImprovement.improvedScript);
      setScriptImprovement(null);
      setActiveFeature(null);
    }
  };

  const getSentimentColor = (sent: string) => {
    const colors: Record<string, string> = {
      professional: 'text-blue-400',
      friendly: 'text-green-400',
      urgent: 'text-red-400',
      casual: 'text-yellow-400',
      formal: 'text-gray-400'
    };
    return colors[sent] || 'text-white';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-4">
      <h3 className="text-xl font-bold text-yellow-400">AI Enhancement Features</h3>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleImproveScript}
          disabled={loading || !script}
          className="px-4 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Improve Script
        </button>

        <button
          onClick={handleAnalyzeSentiment}
          disabled={loading || !script}
          className="px-4 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Analyze Tone
        </button>

        <button
          onClick={handleAnalyzeVideo}
          disabled={loading || !videoBlob}
          className="px-4 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Score Video
        </button>

        <button
          onClick={handleDetectFillers}
          disabled={loading || !videoBlob}
          className="px-4 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Find Fillers
        </button>

        <button
          onClick={handleRecommendScenes}
          disabled={loading || !script}
          className="px-4 py-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm col-span-2"
        >
          Suggest More Scenes
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-3 text-gray-300">Analyzing with AI...</p>
        </div>
      )}

      {scriptImprovement && activeFeature === 'improve' && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-green-400">Script Improvements</h4>
            <span className="text-sm text-gray-400">Score: {scriptImprovement.improvementScore}/100</span>
          </div>

          <div className="bg-gray-800 p-3 rounded text-sm">
            <p className="text-gray-300">{scriptImprovement.improvedScript}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400">Improvements Made:</p>
            {scriptImprovement.suggestions.map((suggestion, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-green-400 text-xs mt-1">✓</span>
                <p className="text-xs text-gray-300">{suggestion}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={applyScriptImprovement}
              className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 text-sm"
            >
              Apply Changes
            </button>
            <button
              onClick={() => { setScriptImprovement(null); setActiveFeature(null); }}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {sentiment && activeFeature === 'sentiment' && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-blue-400">Tone Analysis</h4>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Detected Tone:</span>
            <span className={`font-bold text-lg ${getSentimentColor(sentiment.sentiment)}`}>
              {sentiment.sentiment.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">
              ({Math.round(sentiment.confidence * 100)}% confidence)
            </span>
          </div>

          {sentiment.suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400">Suggestions:</p>
              {sentiment.suggestions.map((suggestion, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-blue-400 text-xs mt-1">💡</span>
                  <p className="text-xs text-gray-300">{suggestion}</p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => { setSentiment(null); setActiveFeature(null); }}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm"
          >
            Close
          </button>
        </div>
      )}

      {videoQuality && activeFeature === 'quality' && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-green-400">Video Quality Score</h4>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400">{videoQuality.score}</div>
              <div className="text-xs text-gray-400">out of 10</div>
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-yellow-400 h-3 rounded-full transition-all"
                  style={{ width: `${(videoQuality.score / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-300">{videoQuality.justification}</p>

          <button
            onClick={() => { setVideoQuality(null); setActiveFeature(null); }}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm"
          >
            Close
          </button>
        </div>
      )}

      {fillerWords && activeFeature === 'fillers' && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-red-400">Filler Words Detected</h4>

          <div className="max-h-48 overflow-y-auto space-y-2">
            {fillerWords.words.filter(w => w.isFiller).map((word, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-800 p-2 rounded text-sm">
                <span className="text-red-300">{word.word}</span>
                <span className="text-gray-500 text-xs">
                  {word.start.toFixed(1)}s - {word.end.toFixed(1)}s
                </span>
              </div>
            ))}
            {fillerWords.words.filter(w => w.isFiller).length === 0 && (
              <p className="text-sm text-green-400">No filler words detected!</p>
            )}
          </div>

          {fillerWords.silences.length > 0 && (
            <>
              <h5 className="text-sm font-semibold text-gray-400 mt-4">Long Silences:</h5>
              <div className="space-y-2">
                {fillerWords.silences.map((silence, i) => (
                  <div key={i} className="flex justify-between items-center bg-gray-800 p-2 rounded text-sm">
                    <span className="text-gray-300">{silence.duration.toFixed(1)}s silence</span>
                    <span className="text-gray-500 text-xs">
                      {silence.start.toFixed(1)}s - {silence.end.toFixed(1)}s
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <button
            onClick={() => { setFillerWords(null); setActiveFeature(null); }}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm"
          >
            Close
          </button>
        </div>
      )}

      {recommendedScenes.length > 0 && activeFeature === 'scenes' && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-purple-400">Recommended Additional Scenes</h4>

          <div className="space-y-2">
            {recommendedScenes.map((scene, i) => (
              <div key={i} className="bg-gray-800 p-3 rounded text-sm text-gray-300">
                {i + 1}. {scene}
              </div>
            ))}
          </div>

          <button
            onClick={() => { setRecommendedScenes([]); setActiveFeature(null); }}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};
