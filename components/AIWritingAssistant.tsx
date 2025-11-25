import React, { useState, useEffect } from 'react';
import { generateScriptFromPrompt } from '../services/geminiService';

interface AIWritingAssistantProps {
  value: string;
  onChange: (value: string) => void;
  context: 'script' | 'email_subject' | 'email_body' | 'campaign_name' | 'video_title' | 'general';
  placeholder?: string;
  targetAudience?: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'urgent' | 'enthusiastic';
  maxLength?: number;
}

type TabType = 'generate' | 'improve' | 'transform' | 'analyze';

interface Suggestion {
  type: 'grammar' | 'clarity' | 'style' | 'tone';
  original: string;
  suggestion: string;
  reason: string;
}

export const AIWritingAssistant: React.FC<AIWritingAssistantProps> = ({
  value,
  onChange,
  context,
  placeholder = 'Enter your text...',
  targetAudience = 'general',
  tone = 'professional',
  maxLength
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('generate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedTone, setSelectedTone] = useState(tone);
  const [selectedLength, setSelectedLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const contextPrompts: Record<string, string> = {
    script: 'video script',
    email_subject: 'email subject line',
    email_body: 'email body content',
    campaign_name: 'campaign name',
    video_title: 'video title',
    general: 'text'
  };

  const toneDescriptions = {
    professional: 'formal, business-appropriate language',
    casual: 'relaxed, conversational tone',
    friendly: 'warm, approachable language',
    urgent: 'compelling, action-oriented',
    enthusiastic: 'energetic, exciting tone'
  };

  const lengthTargets = {
    short: '50-100 words',
    medium: '150-250 words',
    long: '300-500 words'
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt to generate content');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const enhancedPrompt = `Write a ${toneDescriptions[selectedTone]} ${contextPrompts[context]} about: ${prompt}. Target length: ${lengthTargets[selectedLength]}. Target audience: ${targetAudience}.`;
      const generated = await generateScriptFromPrompt(enhancedPrompt);
      onChange(generated);
      setIsOpen(false);
      setPrompt('');
    } catch (err: any) {
      setError(err.message || 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImprove = async () => {
    if (!value.trim()) {
      setError('Please enter some text to improve');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const improvementPrompt = `Improve the following ${contextPrompts[context]} by fixing grammar, improving clarity, and enhancing style. Keep the same general meaning but make it more ${toneDescriptions[selectedTone]}. Original text: "${value}"`;
      const improved = await generateScriptFromPrompt(improvementPrompt);
      onChange(improved);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to improve content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTransform = async (transformation: 'shorter' | 'longer' | 'tone' | 'translate' | 'personalize') => {
    if (!value.trim()) {
      setError('Please enter some text to transform');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      let transformPrompt = '';

      switch (transformation) {
        case 'shorter':
          transformPrompt = `Make this ${contextPrompts[context]} more concise while keeping the key message. Original: "${value}"`;
          break;
        case 'longer':
          transformPrompt = `Expand this ${contextPrompts[context]} with more details and examples. Original: "${value}"`;
          break;
        case 'tone':
          transformPrompt = `Rewrite this ${contextPrompts[context]} in a ${toneDescriptions[selectedTone]} style. Original: "${value}"`;
          break;
        case 'personalize':
          transformPrompt = `Add personalization placeholders (like {{first_name}}, {{company}}) to this ${contextPrompts[context]} to make it suitable for mail merge. Original: "${value}"`;
          break;
        default:
          transformPrompt = value;
      }

      const transformed = await generateScriptFromPrompt(transformPrompt);
      onChange(transformed);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to transform content');
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeText = () => {
    if (!value.trim()) return;

    const words = value.trim().split(/\s+/).length;
    const chars = value.length;
    const sentences = value.split(/[.!?]+/).filter(s => s.trim()).length;
    const avgWordLength = chars / words;
    const avgSentenceLength = words / sentences;

    const readabilityScore = Math.max(0, Math.min(100,
      100 - (avgWordLength * 10) - (avgSentenceLength * 2)
    ));

    const detectTone = () => {
      const urgentWords = ['urgent', 'now', 'immediately', 'quick', 'hurry', 'limited'];
      const friendlyWords = ['thanks', 'please', 'appreciate', 'hope', 'wonderful'];
      const professionalWords = ['regarding', 'pursuant', 'accordingly', 'therefore'];

      const lowerText = value.toLowerCase();

      if (urgentWords.some(w => lowerText.includes(w))) return 'urgent';
      if (friendlyWords.some(w => lowerText.includes(w))) return 'friendly';
      if (professionalWords.some(w => lowerText.includes(w))) return 'professional';
      return 'casual';
    };

    setAnalysis({
      wordCount: words,
      charCount: chars,
      sentenceCount: sentences,
      readabilityScore: Math.round(readabilityScore),
      estimatedReadTime: Math.ceil(words / 200),
      detectedTone: detectTone(),
      avgSentenceLength: Math.round(avgSentenceLength)
    });
  };

  useEffect(() => {
    if (activeTab === 'analyze' && value) {
      analyzeText();
    }
  }, [activeTab, value]);

  const getReadabilityColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute right-2 top-2 p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl z-10 group"
        title="AI Writing Assistant"
      >
        <svg className="w-5 h-5 text-white animate-pulse group-hover:animate-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 top-12 w-96 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 z-50 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  AI Writing Assistant
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex gap-2">
                {(['generate', 'improve', 'transform', 'analyze'] as TabType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all ${
                      activeTab === tab
                        ? 'bg-white text-purple-600'
                        : 'bg-purple-700/30 text-white hover:bg-purple-700/50'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}

              {activeTab === 'generate' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      What would you like to write about?
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={`e.g., "Introduce our new product feature that saves time"`}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Tone</label>
                      <select
                        value={selectedTone}
                        onChange={(e) => setSelectedTone(e.target.value as any)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="friendly">Friendly</option>
                        <option value="urgent">Urgent</option>
                        <option value="enthusiastic">Enthusiastic</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Length</label>
                      <select
                        value={selectedLength}
                        onChange={(e) => setSelectedLength(e.target.value as any)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="short">Short</option>
                        <option value="medium">Medium</option>
                        <option value="long">Long</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Content'}
                  </button>
                </div>
              )}

              {activeTab === 'improve' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">
                    AI will analyze your text and improve grammar, clarity, and style while keeping your message.
                  </p>

                  {value && (
                    <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Current text:</p>
                      <p className="text-sm text-gray-300 line-clamp-4">{value}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Target Tone</label>
                    <select
                      value={selectedTone}
                      onChange={(e) => setSelectedTone(e.target.value as any)}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="friendly">Friendly</option>
                      <option value="urgent">Urgent</option>
                      <option value="enthusiastic">Enthusiastic</option>
                    </select>
                  </div>

                  <button
                    onClick={handleImprove}
                    disabled={isGenerating || !value.trim()}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                  >
                    {isGenerating ? 'Improving...' : 'Improve Text'}
                  </button>
                </div>
              )}

              {activeTab === 'transform' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400 mb-4">
                    Transform your text in different ways:
                  </p>

                  <button
                    onClick={() => handleTransform('shorter')}
                    disabled={isGenerating || !value.trim()}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-left hover:border-purple-500 transition-all disabled:opacity-50 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center group-hover:bg-purple-600/30">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-white">Make Shorter</div>
                        <div className="text-xs text-gray-400">Condense while keeping key points</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleTransform('longer')}
                    disabled={isGenerating || !value.trim()}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-left hover:border-purple-500 transition-all disabled:opacity-50 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center group-hover:bg-blue-600/30">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-white">Make Longer</div>
                        <div className="text-xs text-gray-400">Expand with more details</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleTransform('tone')}
                    disabled={isGenerating || !value.trim()}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-left hover:border-purple-500 transition-all disabled:opacity-50 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center group-hover:bg-green-600/30">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-white">Change Tone</div>
                        <div className="text-xs text-gray-400">Rewrite in {selectedTone} style</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleTransform('personalize')}
                    disabled={isGenerating || !value.trim()}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-left hover:border-purple-500 transition-all disabled:opacity-50 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-600/20 rounded-lg flex items-center justify-center group-hover:bg-yellow-600/30">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-white">Add Personalization</div>
                        <div className="text-xs text-gray-400">Insert merge tags for campaigns</div>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {activeTab === 'analyze' && (
                <div className="space-y-4">
                  {value ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
                          <div className="text-2xl font-bold text-white">{analysis?.wordCount || 0}</div>
                          <div className="text-xs text-gray-400">Words</div>
                        </div>
                        <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
                          <div className="text-2xl font-bold text-white">{analysis?.charCount || 0}</div>
                          <div className="text-xs text-gray-400">Characters</div>
                        </div>
                        <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
                          <div className="text-2xl font-bold text-white">{analysis?.sentenceCount || 0}</div>
                          <div className="text-xs text-gray-400">Sentences</div>
                        </div>
                        <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
                          <div className="text-2xl font-bold text-white">{analysis?.estimatedReadTime || 0}m</div>
                          <div className="text-xs text-gray-400">Read Time</div>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-300">Readability Score</span>
                          <span className={`text-xl font-bold ${getReadabilityColor(analysis?.readabilityScore || 0)}`}>
                            {analysis?.readabilityScore || 0}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${analysis?.readabilityScore || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {analysis?.readabilityScore >= 70 ? 'Excellent - Easy to read' :
                           analysis?.readabilityScore >= 50 ? 'Good - Moderately easy to read' :
                           'Needs work - Complex language'}
                        </p>
                      </div>

                      <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-300">Detected Tone</span>
                          <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-sm font-medium capitalize">
                            {analysis?.detectedTone || 'neutral'}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                        <div className="text-sm text-gray-400 space-y-1">
                          <div>Avg. sentence length: {analysis?.avgSentenceLength || 0} words</div>
                          <div className="text-xs text-gray-500">
                            {analysis?.avgSentenceLength > 20 ? 'Consider shorter sentences for clarity' :
                             analysis?.avgSentenceLength < 10 ? 'Sentences are very short' :
                             'Good sentence length'}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>Enter some text to analyze</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
