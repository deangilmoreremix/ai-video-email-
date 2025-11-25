import React, { useState } from 'react';
import { ScriptEditor } from './ScriptEditor';
import { VideoRecorder, Take } from './VideoRecorder';
import { AIFeaturesPanel } from './AIFeaturesPanel';
import { AdvancedAIPanel } from './AdvancedAIPanel';
import { VisualStyle } from '../services/geminiService';

interface VideoWorkspaceProps {
  script: string;
  onScriptChange: (script: string) => void;
  visualStyle: VisualStyle;
  setVisualStyle: (style: VisualStyle) => void;
  takes: Take[];
  setTakes: (takes: Take[]) => void;
  selectedTake: Take | null;
  onSelectTake: (take: Take) => void;
  onEditTake: (take: Take) => void;
  onCreateCampaign: (take: Take) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  aiScenes: string[];
  setAiScenes: (scenes: string[]) => void;
  onError: (message: string) => void;
}

export const VideoWorkspace: React.FC<VideoWorkspaceProps> = ({
  script,
  onScriptChange,
  visualStyle,
  setVisualStyle,
  takes,
  setTakes,
  selectedTake,
  onSelectTake,
  onEditTake,
  onCreateCampaign,
  onSubmit,
  isSubmitting,
  aiScenes,
  setAiScenes,
  onError
}) => {
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<'ai-features' | 'advanced'>('ai-features');

  return (
    <div className="w-full h-[calc(100vh-120px)] flex gap-4">
      <div className={`transition-all duration-300 ${
        leftPanelCollapsed ? 'w-12' : 'w-[380px]'
      } flex-shrink-0`}>
        {!leftPanelCollapsed ? (
          <div className="h-full bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-900/50">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Script Studio
              </h2>
              <button
                onClick={() => setLeftPanelCollapsed(true)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Collapse panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ScriptEditor
                script={script}
                onScriptChange={onScriptChange}
                visualStyle={visualStyle}
                setVisualStyle={setVisualStyle}
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
                disabled={isSubmitting}
                onError={onError}
              />
            </div>
          </div>
        ) : (
          <div className="h-full bg-gray-800/50 border border-gray-700 rounded-xl flex items-center justify-center">
            <button
              onClick={() => setLeftPanelCollapsed(false)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Expand panel"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 h-full bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-700 bg-gray-900/50">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Video Preview
            </h2>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-400">
                {takes.filter(t => t.status === 'complete').length} takes
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <VideoRecorder
            script={script}
            takes={takes}
            setTakes={setTakes}
            onSelectTake={onSelectTake}
            onEditTake={onEditTake}
            onCreateCampaign={onCreateCampaign}
            selectedTakeId={selectedTake?.id}
            onError={onError}
          />
        </div>
      </div>

      <div className={`transition-all duration-300 ${
        rightPanelCollapsed ? 'w-12' : 'w-[380px]'
      } flex-shrink-0`}>
        {!rightPanelCollapsed ? (
          <div className="h-full bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-700 bg-gray-900/50">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Enhancement Hub
                </h2>
                <button
                  onClick={() => setRightPanelCollapsed(true)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Collapse panel"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveRightTab('ai-features')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeRightTab === 'ai-features'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-900 text-gray-400 hover:text-white'
                  }`}
                >
                  AI Features
                </button>
                <button
                  onClick={() => setActiveRightTab('advanced')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeRightTab === 'advanced'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-900 text-gray-400 hover:text-white'
                  }`}
                >
                  Advanced
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {activeRightTab === 'ai-features' ? (
                <AIFeaturesPanel
                  script={script}
                  onScriptUpdate={onScriptChange}
                  videoBlob={selectedTake?.blob}
                  aiScenes={aiScenes}
                  onScenesUpdate={setAiScenes}
                />
              ) : (
                <AdvancedAIPanel
                  videoBlob={selectedTake?.blob || null}
                  videoId={undefined}
                  script={script}
                  onError={onError}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="h-full bg-gray-800/50 border border-gray-700 rounded-xl flex items-center justify-center">
            <button
              onClick={() => setRightPanelCollapsed(false)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Expand panel"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
