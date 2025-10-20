// FIX: Implement the ScriptEditor component and resolve module errors.
import React, { useState } from 'react';
import { generateScriptFromPrompt, VisualStyle } from '../services/geminiService';
import { WandIcon } from './icons';

interface ScriptEditorProps {
    script: string;
    onScriptChange: (script: string) => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    disabled: boolean;
    // FIX: Add props for visual style selection.
    visualStyle: VisualStyle;
    setVisualStyle: (style: VisualStyle) => void;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ script, onScriptChange, onSubmit, isSubmitting, disabled, visualStyle, setVisualStyle }) => {
    const [assistantPrompt, setAssistantPrompt] = useState('');
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);
    const [assistantError, setAssistantError] = useState<string|null>(null);

    const handleGenerateScript = async () => {
        if (!assistantPrompt.trim()) return;
        setIsGeneratingScript(true);
        setAssistantError(null);
        try {
            const generatedScript = await generateScriptFromPrompt(assistantPrompt);
            onScriptChange(generatedScript);
        } catch (e) {
            setAssistantError('Failed to generate script. Please try again.');
        } finally {
            setIsGeneratingScript(false);
        }
    };

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-2xl shadow-black/20 p-6 backdrop-blur-lg space-y-6">
            
            {/* AI Script Assistant */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-center text-gray-300">1. Create Your Script</h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={assistantPrompt}
                        onChange={(e) => setAssistantPrompt(e.target.value)}
                        placeholder="e.g., a welcome message for a new hire"
                        className="flex-grow bg-gray-900/50 border border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-colors px-3"
                        disabled={isGeneratingScript || disabled}
                    />
                    <button
                        onClick={handleGenerateScript}
                        disabled={!assistantPrompt.trim() || isGeneratingScript || disabled}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Generate Script"
                    >
                       <WandIcon className="w-5 h-5"/>
                       <span>{isGeneratingScript ? 'Generating...' : 'Generate'}</span>
                    </button>
                </div>
                 {assistantError && <p className="text-xs text-red-400 text-center">{assistantError}</p>}
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
                />
                {/* FIX: Add visual style selector */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400 text-center">2. Choose Visual Style</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['Modern Tech', 'Photorealistic', 'Anime'] as VisualStyle[]).map(style => (
                            <button
                                key={style}
                                onClick={() => setVisualStyle(style)}
                                disabled={disabled || isSubmitting}
                                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${visualStyle === style ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 hover:bg-gray-600'}`}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={onSubmit}
                    disabled={!script.trim() || isSubmitting || disabled}
                    className="w-full inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold rounded-full shadow-lg hover:shadow-yellow-500/30 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    {isSubmitting ? 'Generating...' : '3. Generate AI Scenes'}
                </button>
            </div>
        </div>
    );
};
