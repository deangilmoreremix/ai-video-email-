import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ScriptEditor } from './components/ScriptEditor';
import { VideoRecorder, Take } from './components/VideoRecorder';
import { VideoEditor } from './components/VideoEditor';
import { EmailComposer } from './components/EmailComposer';
import { Settings } from './components/Settings';
import { VideoLibrary } from './components/VideoLibrary';
import { LandingPage } from './components/LandingPage';
import { UserVideo } from './lib/supabase';
import { AuthModal } from './components/AuthModal';
import { AIFeaturesPanel } from './components/AIFeaturesPanel';
import { AdvancedAIPanel } from './components/AdvancedAIPanel';
import { ProgressIndicator } from './components/ProgressIndicator';
import { AIAssistant } from './components/AIAssistant';
import { SmartTrigger, useSmartTrigger } from './components/SmartTrigger';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { RateLimitNotification } from './components/RateLimitNotification';
import { VisualStyle, generateVisualsForScript, base64ToBlob, blobToDataURL, getGoogleGenAIInstance } from './services/geminiService';
import { AppContext, AppContextType } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { triggerAIScenesGeneratedEvent } from './services/zapierWebhook';
import { initializeDefaultShortcuts, cleanupShortcuts } from './services/keyboardShortcuts';

export type AppState = 'landing' | 'main' | 'editing' | 'composer';

// Interface for the saved project state
interface SavedProject {
    script: string;
    visualStyle: VisualStyle;
    takes: Omit<Take, 'blob'>[];
    takeBlobs: { [id: string]: string };
    selectedTakeId?: string;
    editedBlobUrl?: string;
    aiScenes: string[];
}

declare const window: any;

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>('landing');
    const [script, setScript] = useState<string>('');
    const [visualStyle, setVisualStyle] = useState<VisualStyle>('Modern Tech');
    const [takes, setTakes] = useState<Take[]>([]);
    const [selectedTake, setSelectedTake] = useState<Take | null>(null);
    const [editedBlob, setEditedBlob] = useState<Blob | null>(null);
    const [aiScenes, setAiScenes] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    const [isLoaded, setIsLoaded] = useState(false);
    const [libraries, setLibraries] = useState<AppContextType>({ ffmpeg: null, mediaPipeEffects: null, getGoogleGenAIInstance: getGoogleGenAIInstance });
    const librariesRef = useRef<AppContextType>({ ffmpeg: null, mediaPipeEffects: null, getGoogleGenAIInstance: getGoogleGenAIInstance });
    const [librariesReady, setLibrariesReady] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showVideoLibrary, setShowVideoLibrary] = useState(false);
    const [editingFromLibrary, setEditingFromLibrary] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [showAdmin, setShowAdmin] = useState(false);
    const [presentationScore, setPresentationScore] = useState<number>();
    const [hasChapters, setHasChapters] = useState(false);
    const [hasSEO, setHasSEO] = useState(false);
    const [hasTeamApproval, setHasTeamApproval] = useState(false);
    const [hasEngagementPrediction, setHasEngagementPrediction] = useState(false);
    const { trigger, showTrigger, hideTrigger } = useSmartTrigger();
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

    const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
      let timeout: number;
      return (...args: Parameters<F>): Promise<void> =>
        new Promise(resolve => {
          clearTimeout(timeout);
          timeout = window.setTimeout(() => resolve(func(...args)), waitFor);
        });
    };

    const saveProject = useCallback(debounce(async (
        currentScript: string,
        currentVisualStyle: VisualStyle,
        currentTakes: Take[],
        currentAiScenes: string[],
        currentSelectedTakeId?: string,
        currentEditedBlob?: Blob | null
    ) => {
        try {
            const takeBlobs: { [id: string]: string } = {};
            for (const take of currentTakes) {
                takeBlobs[take.id] = await blobToDataURL(take.blob);
            }
            
            let editedBlobUrl: string | undefined = undefined;
            if (currentEditedBlob) {
                editedBlobUrl = await blobToDataURL(currentEditedBlob);
            }

            const project: SavedProject = {
                script: currentScript,
                visualStyle: currentVisualStyle,
                takes: currentTakes.map(({ blob, ...rest }) => rest),
                takeBlobs,
                aiScenes: currentAiScenes,
                selectedTakeId: currentSelectedTakeId,
                editedBlobUrl
            };
            localStorage.setItem('aiVideoProject', JSON.stringify(project));
        } catch (e: any) {
            console.error("Failed to save project:", e);
        }
    }, 1000), []);

    useEffect(() => {
        if (isLoaded && librariesReady) {
             saveProject(script, visualStyle, takes, aiScenes, selectedTake?.id, editedBlob);
        }
    }, [script, visualStyle, takes, aiScenes, selectedTake, editedBlob, saveProject, isLoaded, librariesReady]);
    
    useEffect(() => {
        const loadProject = async () => {
            const savedData = localStorage.getItem('aiVideoProject');
            if (savedData) {
                try {
                    const project: SavedProject = JSON.parse(savedData);
                    const loadedTakes: Take[] = [];
                    for (const takeData of project.takes) {
                        const blobUrl = project.takeBlobs[takeData.id];
                        if (blobUrl) {
                            const blob = await base64ToBlob(blobUrl);
                            loadedTakes.push({ ...takeData, blob });
                        }
                    }

                    setScript(project.script);
                    setVisualStyle(project.visualStyle);
                    setTakes(loadedTakes);
                    setAiScenes(project.aiScenes);

                    if (project.selectedTakeId) {
                       const foundTake = loadedTakes.find(t => t.id === project.selectedTakeId);
                       if (foundTake) setSelectedTake(foundTake);
                    }
                    if (project.editedBlobUrl) {
                        const blob = await base64ToBlob(project.editedBlobUrl);
                        setEditedBlob(blob);
                    }

                } catch (e: any) {
                    console.error("Failed to load project:", e);
                    localStorage.removeItem('aiVideoProject');
                }
            }
            setIsLoaded(true);
        };
        loadProject();
    }, []);
    
    useEffect(() => {
        const init = async () => {
            // Early check for API_KEY
            if (!import.meta.env.VITE_GEMINI_API_KEY) {
                setLoadError("API_KEY environment variable is not configured. Please ensure your API key is set.");
                return; // Stop initialization if API key is missing
            }

            // Initialize with basic context - libraries will be loaded on-demand
            const libs = {
                ffmpeg: null,
                mediaPipeEffects: null,
                getGoogleGenAIInstance: getGoogleGenAIInstance,
            };
            setLibraries(libs);
            librariesRef.current = libs;
            setLibrariesReady(true);
        };

        init();

        initializeDefaultShortcuts({
            onHelp: () => setShowKeyboardShortcuts(true),
            onSave: () => saveProject(script, visualStyle, takes, aiScenes, selectedTake?.id, editedBlob),
        });

        // Cleanup logic
        return () => {
            const { mediaPipeEffects } = librariesRef.current;
            if (mediaPipeEffects) {
                mediaPipeEffects.segmenter?.close();
                mediaPipeEffects.faceMesh?.close();
                mediaPipeEffects.handLandmarker?.close();
            }
            cleanupShortcuts();
        };
    }, []); // This effect should only run once on mount.

    const handleGlobalError = useCallback((message: string) => {
        setError(message);
        // Clear error after some time
        const timeout = setTimeout(() => setError(null), 5000);
        return () => clearTimeout(timeout);
    }, []);
    
    const handleNewProject = () => {
        localStorage.removeItem('aiVideoProject');
        setScript('');
        setVisualStyle('Modern Tech');
        setTakes([]);
        setSelectedTake(null);
        setEditedBlob(null);
        setAiScenes([]);
        setError(null);
        setAppState('main');
    };

    const handleSelectTake = (take: Take) => {
        setSelectedTake(take);
        setAppState('main');

        if (takes.filter(t => t.status === 'complete').length === 1) {
            showTrigger(
                'Recording Complete!',
                'Great job! Now let\'s optimize your video for maximum engagement.',
                [
                    { label: 'Skip', action: () => {} },
                    { label: 'Analyze Video', action: () => {}, primary: true }
                ],
                'success'
            );
        }
    };

    const handleEditVideo = (take: Take) => {
        setSelectedTake(take);
        setEditingFromLibrary(false);
        setAppState('editing');
    };

    const handleEditVideoFromLibrary = async (video: UserVideo) => {
        try {
            const response = await fetch(video.video_url);
            const blob = await response.blob();

            const fakeTake: Take = {
                id: video.id,
                blob: blob,
                url: video.video_url,
                transcript: video.transcript || null,
                analysis: null,
                status: 'complete'
            };

            setSelectedTake(fakeTake);
            setEditingFromLibrary(true);
            setShowVideoLibrary(false);
            setAppState('editing');
        } catch (error: any) {
            handleGlobalError(`Failed to load video for editing: ${error.message}`);
        }
    };

    const handleFinishEditing = (finalBlob: Blob) => {
        setEditedBlob(finalBlob);
        if (editingFromLibrary) {
            setAppState('main');
            setEditingFromLibrary(false);
            handleGlobalError('Video edited successfully! You can now use it.');
        } else {
            setAppState('composer');
        }
    };
    
    const handleGenerateScenes = async () => {
        if (!script.trim()) {
            handleGlobalError("Please write a script first.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const scenes = await generateVisualsForScript(script, visualStyle);
            setAiScenes(scenes);

            await triggerAIScenesGeneratedEvent({
                script,
                scene_count: scenes.length,
                visual_style: visualStyle,
            });

            setAppState('composer');
        } catch (e: any) {
            console.error(e);
            handleGlobalError(`Failed to generate AI scenes: ${e.message || 'Unknown error'}. Please ensure your API Key is valid.`);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (loadError) {
        return (
            <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center p-4">
                 <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center max-w-md">
                    <p className="font-bold text-lg mb-2">Application Error</p>
                    <p>{loadError}</p>
                    <p className="mt-2 text-sm">Please check your environment configuration or browser console for details.</p>
                </div>
            </div>
        );
    }

    if (!isLoaded || !librariesReady) {
         return (
            <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-lg text-gray-300 font-semibold">Initializing Studio...</p>
            </div>
        );
    }

    const renderContent = () => {
        switch(appState) {
            case 'landing':
                return <LandingPage onGetStarted={() => setAppState('main')} />;
            case 'editing':
                if (!selectedTake) {
                    setAppState('main');
                    return null;
                }
                return <VideoEditor
                    take={selectedTake}
                    onFinishEditing={handleFinishEditing}
                    onCancel={() => {
                        setAppState('main');
                        setEditingFromLibrary(false);
                    }}
                    onError={handleGlobalError}
                    editingFromLibrary={editingFromLibrary}
                />;
            case 'composer':
                 if (!selectedTake) {
                    setAppState('main');
                    return null;
                }
                return <EmailComposer
                    personalVideoBlob={editedBlob || selectedTake.blob}
                    aiSceneUrls={aiScenes}
                    script={script}
                    transcript={selectedTake.transcript}
                    onBack={() => setAppState('main')}
                 />
            case 'main':
            default:
                return (
                    <div className="w-full max-w-7xl mx-auto space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <ScriptEditor
                                script={script}
                                onScriptChange={setScript}
                                visualStyle={visualStyle}
                                setVisualStyle={setVisualStyle}
                                onSubmit={handleGenerateScenes}
                                isSubmitting={isLoading}
                                disabled={isLoading}
                                onError={handleGlobalError}
                            />
                            <VideoRecorder
                                script={script}
                                takes={takes}
                                setTakes={setTakes}
                                onSelectTake={handleSelectTake}
                                onEditTake={handleEditVideo}
                                selectedTakeId={selectedTake?.id}
                                onError={handleGlobalError}
                            />
                        </div>
                        {(script || selectedTake) && (
                            <>
                                <AIFeaturesPanel
                                    script={script}
                                    onScriptUpdate={setScript}
                                    videoBlob={selectedTake?.blob}
                                    aiScenes={aiScenes}
                                    onScenesUpdate={setAiScenes}
                                />
                                <AdvancedAIPanel
                                    videoBlob={selectedTake?.blob || null}
                                    videoId={undefined}
                                    script={script}
                                    onError={handleGlobalError}
                                />
                            </>
                        )}
                    </div>
                );
        }
    };

    return (
        <AuthProvider>
            <AppContext.Provider value={libraries}>
                <div className="bg-gray-900 text-white min-h-screen font-sans flex flex-col">
                {appState !== 'landing' && (
                    <Header
                        onNewProject={handleNewProject}
                        onOpenSettings={() => setShowSettings(true)}
                        onOpenVideoLibrary={() => setShowVideoLibrary(true)}
                        onOpenAuth={() => setShowAuth(true)}
                        onOpenAdmin={() => setShowAdmin(true)}
                    />
                )}
                <main className={`${appState === 'landing' ? '' : 'container mx-auto px-4 py-8'} flex-grow flex items-start justify-center`}>
                     {error && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6 text-center fixed top-24 z-50">
                            <p>{error}</p>
                        </div>
                    )}
                    {renderContent()}
                </main>
                {showSettings && <Settings onClose={() => setShowSettings(false)} />}
                {showVideoLibrary && <VideoLibrary
                    onClose={() => setShowVideoLibrary(false)}
                    onEditVideo={handleEditVideoFromLibrary}
                />}
                {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
                {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}
                {showKeyboardShortcuts && <KeyboardShortcutsHelp onClose={() => setShowKeyboardShortcuts(false)} />}
                <RateLimitNotification />

                {appState !== 'landing' && (
                    <>
                        <ProgressIndicator
                            script={script}
                            videoRecorded={takes.some(t => t.status === 'complete')}
                            presentationScore={presentationScore}
                            hasChapters={hasChapters}
                            hasSEO={hasSEO}
                            hasTeamApproval={hasTeamApproval}
                            hasEngagementPrediction={hasEngagementPrediction}
                            onAction={(action) => {
                                if (action === 'continue') {
                                    console.log('Continue optimization');
                                }
                            }}
                        />

                        <AIAssistant
                            currentContext={
                                appState === 'editing' ? 'editing' :
                                appState === 'composer' ? 'composer' :
                                takes.some(t => t.status === 'recording') ? 'recording' :
                                script ? 'script' : 'idle'
                            }
                            script={script}
                            isRecording={takes.some(t => t.status === 'recording')}
                            hasVideo={takes.some(t => t.status === 'complete')}
                        />

                        <SmartTrigger
                            show={trigger.show}
                            title={trigger.title}
                            message={trigger.message}
                            actions={trigger.actions}
                            onDismiss={hideTrigger}
                            type={trigger.type}
                        />
                    </>
                )}
                </div>
            </AppContext.Provider>
        </AuthProvider>
    );
};

export default App;