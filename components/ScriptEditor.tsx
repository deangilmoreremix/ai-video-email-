import React, { useState, useEffect } from 'react';
import { generateScriptFromPrompt, VisualStyle, getKeywordsFromScript } from '../services/geminiService';
import { WandIcon } from './icons';

const getStyleIcon = (style: VisualStyle): string => {
    const icons: Record<VisualStyle, string> = {
        'Modern Tech': '💻',
        'Photorealistic': '📸',
        'Anime': '🎨',
        'Cinematic': '🎬',
        'Minimalist': '⬜',
        'Corporate': '💼',
        'Vibrant': '🌈',
        'Dark Mode': '🌙'
    };
    return icons[style] || '✨';
};

const getStyleDescription = (style: VisualStyle): string => {
    const descriptions: Record<VisualStyle, string> = {
        'Modern Tech': 'Futuristic tech visuals with glowing elements and data visualizations',
        'Photorealistic': 'Professional photo-quality images with cinematic lighting',
        'Anime': 'Vibrant anime-style artwork with expressive characters',
        'Cinematic': 'Movie-quality scenes with dramatic lighting and film grain',
        'Minimalist': 'Clean, simple designs with elegant negative space',
        'Corporate': 'Professional business aesthetic for formal presentations',
        'Vibrant': 'Bold, energetic colors for maximum visual impact',
        'Dark Mode': 'Moody, dramatic aesthetic with deep shadows'
    };
    return descriptions[style] || 'Custom visual style';
};
import { useAppLibs } from '../contexts/AppContext';
import { TemplateSelector } from './TemplateSelector';
import { generateSEOTitle, predictEngagement, SEOMetadata, EngagementPreview } from '../services/seoService';

interface ScriptEditorProps {
    script: string;
    onScriptChange: (script: string) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    disabled: boolean;
    visualStyle: VisualStyle;
    setVisualStyle: (style: VisualStyle) => void;
    onError: (message: string) => void; // New prop for error handling
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ script, onScriptChange, onSubmit, isSubmitting, disabled, visualStyle, setVisualStyle, onError }) => {
    const { getGoogleGenAIInstance } = useAppLibs();
    const [assistantPrompt, setAssistantPrompt] = useState('');
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [activeTab, setActiveTab] = useState<'prompt' | 'template'>('prompt');
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [seoMetadata, setSeoMetadata] = useState<SEOMetadata | null>(null);
    const [engagementPreview, setEngagementPreview] = useState<EngagementPreview | null>(null);
    const [loadingSEO, setLoadingSEO] = useState(false);
    const [loadingEngagement, setLoadingEngagement] = useState(false);
    // Removed assistantError, will use global onError
    
    // Removed auto-analysis to prevent errors - users click buttons instead

    const analyzeSEO = async () => {
        if (!script.trim()) return;
        setLoadingSEO(true);
        try {
            const metadata = await generateSEOTitle(script);
            setSeoMetadata(metadata);
        } catch (e) {
            console.error('Failed to generate SEO:', e);
        } finally {
            setLoadingSEO(false);
        }
    };

    const analyzeEngagement = async () => {
        if (!script.trim()) return;
        setLoadingEngagement(true);
        try {
            const preview = await predictEngagement(script);
            setEngagementPreview(preview);
        } catch (e) {
            console.error('Failed to predict engagement:', e);
        } finally {
            setLoadingEngagement(false);
        }
    };

    const handleGenerateScript = async () => {
        if (!assistantPrompt.trim()) {
            onError("Please enter a prompt to generate a script.");
            return;
        }
        setIsGeneratingScript(true);
        onError('');
        try {
            const generatedScript = await generateScriptFromPrompt(assistantPrompt);
            onScriptChange(generatedScript);
        } catch (e: any) {
            onError(`Failed to generate script: ${e.message || 'Unknown error'}. Please ensure your API Key is valid.`);
        } finally {
            setIsGeneratingScript(false);
        }
    };

    const handleTemplateGenerated = (generatedScript: string) => {
        onScriptChange(generatedScript);
        setShowTemplateSelector(false);
    };

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-2xl shadow-black/20 p-6 backdrop-blur-lg space-y-6">
            
            {/* Tab Navigation */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-center text-gray-300">1. Create Your Script</h3>
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setActiveTab('prompt')}
                        className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                            activeTab === 'prompt'
                                ? 'bg-yellow-400 text-gray-900'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        Generate from Prompt
                    </button>
                    <button
                        onClick={() => setActiveTab('template')}
                        className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                            activeTab === 'template'
                                ? 'bg-yellow-400 text-gray-900'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        Use Template
                    </button>
                </div>

                {/* AI Script Assistant */}
                {activeTab === 'prompt' ? (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={assistantPrompt}
                            onChange={(e) => setAssistantPrompt(e.target.value)}
                            placeholder="e.g., a welcome message for a new hire"
                            className="flex-grow bg-gray-900/50 border border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors px-3"
                            disabled={isGeneratingScript || disabled}
                            aria-label="Script generation prompt"
                        />
                        <button
                            onClick={handleGenerateScript}
                            disabled={!assistantPrompt.trim() || isGeneratingScript || disabled}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Generate Script"
                            aria-label={isGeneratingScript ? 'Generating Script' : 'Generate Script'}
                            role="button"
                        >
                            <WandIcon className="w-5 h-5"/>
                            <span>{isGeneratingScript ? 'Generating...' : 'Generate'}</span>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowTemplateSelector(true)}
                        disabled={disabled}
                        className="w-full py-3 px-4 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                        Choose Template
                    </button>
                )}
            </div>

            <div className="flex items-center gap-4">
                <hr className="flex-grow border-gray-700" />
                <span className="text-gray-500 font-semibold">OR WRITE MANUALLY</span>
                <hr className="flex-grow border-gray-700" />
            </div>

            {/* Main Script Editor */}
            <div className="space-y-4">
                <textarea
                    value={script}
                    onChange={(e) => onScriptChange(e.target.value)}
                    placeholder="Your generated or manually written script will appear here..."
                    className="w-full h-40 p-3 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors resize-none"
                    disabled={disabled || isSubmitting}
                    aria-label="Video script editor"
                />

                {/* SEO Title Suggestion */}
                {script.trim() && script.split(' ').length >= 20 && (
                    <>
                        {!seoMetadata && !loadingSEO && (
                            <button
                                onClick={analyzeSEO}
                                disabled={disabled}
                                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 text-sm"
                            >
                                🎯 Generate SEO Title & Keywords
                            </button>
                        )}
                        {loadingSEO && (
                            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                                <span className="text-sm text-gray-400">Generating SEO metadata...</span>
                            </div>
                        )}
                        {seoMetadata && (
                            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-yellow-400">💡</span>
                                    <h4 className="text-sm font-semibold text-gray-300">Suggested Title</h4>
                                </div>
                                <p className="text-white mb-2">{seoMetadata.optimizedTitle}</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigator.clipboard.writeText(seoMetadata.optimizedTitle)}
                                        className="text-xs px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                                    >
                                        Copy Title
                                    </button>
                                    <button
                                        onClick={analyzeSEO}
                                        className="text-xs px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                                    >
                                        Regenerate
                                    </button>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-700">
                                    <p className="text-xs text-gray-400 mb-2">Keywords: {seoMetadata.keywords.join(', ')}</p>
                                    <p className="text-xs text-gray-400">Hashtags: {seoMetadata.suggestedHashtags.join(' ')}</p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Engagement Preview */}
                {script.trim() && script.split(' ').length >= 20 && (
                    <>
                        {!engagementPreview && !loadingEngagement && (
                            <button
                                onClick={analyzeEngagement}
                                disabled={disabled}
                                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 text-sm"
                            >
                                📊 Predict Engagement Score
                            </button>
                        )}
                        {loadingEngagement && (
                            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                                <span className="text-sm text-gray-400">Analyzing engagement...</span>
                            </div>
                        )}
                        {engagementPreview && (
                            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-sm font-semibold text-gray-300">Script Quality Meter</h4>
                                    <button
                                        onClick={analyzeEngagement}
                                        className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                                    >
                                        Refresh
                                    </button>
                                </div>
                                <div className="mb-3">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-gray-400">Engagement Score</span>
                                        <span className="text-sm font-bold text-white">{engagementPreview.score}/100</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all ${
                                                engagementPreview.score >= 80
                                                    ? 'bg-green-500'
                                                    : engagementPreview.score >= 60
                                                    ? 'bg-yellow-500'
                                                    : 'bg-red-500'
                                            }`}
                                            style={{ width: `${engagementPreview.score}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span>{engagementPreview.hasHook ? '✓' : '⚠️'}</span>
                                        <span className="text-gray-400">
                                            {engagementPreview.hasHook ? 'Strong opening hook' : 'Consider adding opening hook'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>{engagementPreview.hasCTA ? '✓' : '⚠️'}</span>
                                        <span className="text-gray-400">
                                            {engagementPreview.hasCTA ? 'Clear call-to-action' : 'Consider adding CTA at end'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>✓</span>
                                        <span className="text-gray-400">
                                            Good pacing ({engagementPreview.pacingWordsPerMinute} words/min)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
                <div className="space-y-2">
                    <label id="visual-style-label" className="block text-sm font-medium text-gray-400 text-center">2. Choose Visual Style</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2" role="radiogroup" aria-labelledby="visual-style-label">
                        {(['Modern Tech', 'Photorealistic', 'Anime', 'Cinematic', 'Minimalist', 'Corporate', 'Vibrant', 'Dark Mode'] as VisualStyle[]).map(style => (
                            <button
                                key={style}
                                onClick={() => setVisualStyle(style)}
                                disabled={disabled || isSubmitting}
                                className={`px-3 py-2 text-xs md:text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                                    visualStyle === style
                                        ? 'bg-yellow-500 text-gray-900 ring-2 ring-yellow-400'
                                        : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                }`}
                                aria-pressed={visualStyle === style}
                                aria-label={`${style} visual style`}
                                role="radio"
                                title={getStyleDescription(style)}
                            >
                                {getStyleIcon(style)} {style}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-2">{getStyleDescription(visualStyle)}</p>
                </div>
                <button
                    onClick={onSubmit}
                    disabled={!script.trim() || isSubmitting || disabled}
                    className="w-full inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold rounded-full shadow-lg hover:shadow-yellow-500/30 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                    aria-label={isSubmitting ? 'Generating AI Scenes' : 'Generate AI Scenes'}
                    role="button"
                >
                    {isSubmitting ? 'Generating...' : '3. Generate AI Scenes'}
                </button>
            </div>

            {showTemplateSelector && (
                <TemplateSelector
                    onScriptGenerated={handleTemplateGenerated}
                    onClose={() => setShowTemplateSelector(false)}
                />
            )}
        </div>
    );
};