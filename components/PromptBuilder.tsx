import React, { useState, useEffect } from 'react';
import {
  improvePrompt,
  analyzePromptQuality,
  generatePromptVariations,
  enhancePromptWithContext,
  PROMPT_CATEGORIES,
  PromptCategory,
  PromptImprovement,
  PromptAnalysis,
  PromptVariation
} from '../services/promptService';
import { WandIcon, SparklesIcon } from './icons';

interface PromptBuilderProps {
  initialPrompt?: string;
  onPromptGenerated: (prompt: string) => void;
  onError: (message: string) => void;
}

export const PromptBuilder: React.FC<PromptBuilderProps> = ({
  initialPrompt = '',
  onPromptGenerated,
  onError
}) => {
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [prompt, setPrompt] = useState(initialPrompt);
  const [category, setCategory] = useState<PromptCategory>('sales_pitch');

  const [targetAudience, setTargetAudience] = useState('');
  const [videoPurpose, setVideoPurpose] = useState('');
  const [tone, setTone] = useState('professional');
  const [keyMessage, setKeyMessage] = useState('');
  const [videoLength, setVideoLength] = useState(60);

  const [isImproving, setIsImproving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);

  const [improvement, setImprovement] = useState<PromptImprovement | null>(null);
  const [analysis, setAnalysis] = useState<PromptAnalysis | null>(null);
  const [variations, setVariations] = useState<PromptVariation[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (prompt.length > 10 && !isAnalyzing) {
      const timer = setTimeout(() => {
        handleAnalyze();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [prompt]);

  const handleAnalyze = async () => {
    if (!prompt.trim() || prompt.length < 10) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzePromptQuality(prompt);
      setAnalysis(result);
    } catch (error: any) {
      console.error('Failed to analyze prompt:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImprove = async () => {
    if (!prompt.trim()) {
      onError('Please enter a prompt first');
      return;
    }

    setIsImproving(true);
    try {
      const context = mode === 'advanced' ? {
        targetAudience,
        videoPurpose,
        tone,
        keyMessage,
        videoLength
      } : undefined;

      const result = await improvePrompt(prompt, context);
      setImprovement(result);
      setShowComparison(true);
    } catch (error: any) {
      onError(`Failed to improve prompt: ${error.message || 'Unknown error'}`);
    } finally {
      setIsImproving(false);
    }
  };

  const handleGenerateVariations = async () => {
    if (!prompt.trim()) {
      onError('Please enter a prompt first');
      return;
    }

    setIsGeneratingVariations(true);
    try {
      const result = await generatePromptVariations(prompt, 3);
      setVariations(result);
    } catch (error: any) {
      onError(`Failed to generate variations: ${error.message || 'Unknown error'}`);
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  const handleEnhancer = async (enhancer: string) => {
    if (!prompt.trim()) {
      onError('Please enter a prompt first');
      return;
    }

    try {
      const enhancers: any = {
        addCTA: enhancer === 'cta',
        addUrgency: enhancer === 'urgency',
        addPersonalization: enhancer === 'personalization',
        addStatistics: enhancer === 'statistics',
        addEmotionalAppeal: enhancer === 'emotion'
      };

      const enhanced = await enhancePromptWithContext(prompt, enhancers);
      setPrompt(enhanced);
    } catch (error: any) {
      onError(`Failed to enhance prompt: ${error.message || 'Unknown error'}`);
    }
  };

  const handleUseImproved = () => {
    if (improvement) {
      setPrompt(improvement.improvedPrompt);
      setShowComparison(false);
      setImprovement(null);
    }
  };

  const handleUseVariation = (variation: PromptVariation) => {
    setPrompt(variation.prompt);
    setVariations([]);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('simple')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            mode === 'simple'
              ? 'bg-yellow-400 text-gray-900'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Simple Mode
        </button>
        <button
          onClick={() => setMode('advanced')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            mode === 'advanced'
              ? 'bg-yellow-400 text-gray-900'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Advanced Mode
        </button>
      </div>

      {/* Advanced Mode Fields */}
      {mode === 'advanced' && (
        <div className="bg-gray-900/50 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-white mb-3">Additional Context</h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PromptCategory)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-400"
              >
                {PROMPT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-400"
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="casual">Casual</option>
                <option value="urgent">Urgent</option>
                <option value="formal">Formal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Target Audience</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g., Small business owners, Tech executives"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Video Purpose</label>
            <input
              type="text"
              value={videoPurpose}
              onChange={(e) => setVideoPurpose(e.target.value)}
              placeholder="e.g., Introduce product, Book meeting, Share update"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Key Message</label>
            <input
              type="text"
              value={keyMessage}
              onChange={(e) => setKeyMessage(e.target.value)}
              placeholder="e.g., Our product saves time and money"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Target Length: {videoLength} seconds
            </label>
            <input
              type="range"
              min="30"
              max="180"
              step="15"
              value={videoLength}
              onChange={(e) => setVideoLength(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Main Prompt Input */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-300">Your Prompt</label>
          <span className="text-xs text-gray-500">{prompt.length} characters</span>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want your video to be about..."
          className="w-full h-32 bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 resize-none"
        />

        {/* Quick Enhancers */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleEnhancer('cta')}
            disabled={!prompt.trim()}
            className="px-3 py-1 text-xs bg-gray-700 text-white rounded-full hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            + Call to Action
          </button>
          <button
            onClick={() => handleEnhancer('urgency')}
            disabled={!prompt.trim()}
            className="px-3 py-1 text-xs bg-gray-700 text-white rounded-full hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            + Urgency
          </button>
          <button
            onClick={() => handleEnhancer('personalization')}
            disabled={!prompt.trim()}
            className="px-3 py-1 text-xs bg-gray-700 text-white rounded-full hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            + Personalization
          </button>
          <button
            onClick={() => handleEnhancer('emotion')}
            disabled={!prompt.trim()}
            className="px-3 py-1 text-xs bg-gray-700 text-white rounded-full hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            + Emotion
          </button>
        </div>
      </div>

      {/* Real-time Analysis */}
      {analysis && prompt.length > 10 && (
        <div className="bg-gray-900/50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-white">Prompt Quality</h4>
            <span className={`text-2xl font-bold ${getScoreColor(analysis.overallScore)}`}>
              {analysis.overallScore}/100
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Clarity</span>
                <span>{analysis.clarity}/100</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${getScoreBgColor(analysis.clarity)}`}
                  style={{ width: `${analysis.clarity}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Specificity</span>
                <span>{analysis.specificity}/100</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${getScoreBgColor(analysis.specificity)}`}
                  style={{ width: `${analysis.specificity}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Completeness</span>
                <span>{analysis.completeness}/100</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${getScoreBgColor(analysis.completeness)}`}
                  style={{ width: `${analysis.completeness}%` }}
                />
              </div>
            </div>
          </div>

          {analysis.issues.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-red-400 mb-1">Issues to Fix:</p>
              <ul className="text-xs text-gray-400 space-y-1">
                {analysis.issues.map((issue, i) => (
                  <li key={i}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleImprove}
          disabled={!prompt.trim() || isImproving}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold rounded-lg hover:shadow-lg hover:shadow-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <SparklesIcon className="w-5 h-5" />
          {isImproving ? 'Improving...' : 'Improve Prompt'}
        </button>

        <button
          onClick={handleGenerateVariations}
          disabled={!prompt.trim() || isGeneratingVariations}
          className="px-4 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
        >
          {isGeneratingVariations ? '...' : 'Variations'}
        </button>
      </div>

      {/* Use Current Prompt Button */}
      <button
        onClick={() => onPromptGenerated(prompt)}
        disabled={!prompt.trim()}
        className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        Use This Prompt
      </button>

      {/* Improvement Comparison */}
      {showComparison && improvement && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-white">Prompt Improvement</h4>
            <button
              onClick={() => setShowComparison(false)}
              className="text-gray-400 hover:text-white text-xl"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2">Original</p>
              <p className="text-sm text-gray-300 bg-gray-800 p-3 rounded-lg">
                {improvement.originalPrompt}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-green-400 mb-2">
                Improved (Score: {improvement.qualityScore}/100)
              </p>
              <p className="text-sm text-white bg-green-900/20 border border-green-700 p-3 rounded-lg">
                {improvement.improvedPrompt}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-yellow-400 mb-2">Improvements Made:</p>
            <ul className="text-xs text-gray-300 space-y-1">
              {improvement.improvements.map((imp, i) => (
                <li key={i}>✓ {imp}</li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleUseImproved}
            className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Use Improved Prompt
          </button>
        </div>
      )}

      {/* Variations */}
      {variations.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-white">Prompt Variations</h4>
            <button
              onClick={() => setVariations([])}
              className="text-gray-400 hover:text-white text-xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {variations.map((variation, index) => (
              <div key={index} className="bg-gray-800 p-3 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-semibold text-yellow-400">
                      {variation.style}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      Focuses on: {variation.focusArea}
                    </span>
                  </div>
                  <button
                    onClick={() => handleUseVariation(variation)}
                    className="text-xs px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    Use
                  </button>
                </div>
                <p className="text-sm text-gray-300">{variation.prompt}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
