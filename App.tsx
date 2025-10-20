
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ScriptEditor } from './components/ScriptEditor';
import { VideoRecorder, Take } from './components/VideoRecorder';
import { VideoEditor } from './components/VideoEditor';
import { EmailComposer } from './components/EmailComposer';
import { VisualStyle, generateVisualsForScript, base64ToBlob, blobToDataURL } from './services/geminiService';

export type AppState = 'main' | 'editing' | 'composer';

// Interface for the saved project state
interface SavedProject {
    script: string;
    visualStyle: VisualStyle;
    takes: Omit<Take, 'blob'>[]; // Store takes without the blob
    takeBlobs: { [id: string]: string }; // Store blobs as data URLs
    selectedTakeId?: string;
    editedBlobUrl?: string;
    aiScenes: string[];
}


const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>('main');
    const [script, setScript] = useState<string>('');
    const [visualStyle, setVisualStyle] = useState<VisualStyle>('Modern Tech');
    const [takes, setTakes] = useState<Take[]>([]);
    const [selectedTake, setSelectedTake] = useState<Take | null>(null);
    const [editedBlob, setEditedBlob] = useState<Blob | null>(null);
    const [aiScenes, setAiScenes] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Debounce saving to avoid excessive writes
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
                takes: currentTakes.map(({ blob, ...rest }) => rest), // Don't save blob in main array
                takeBlobs,
                aiScenes: currentAiScenes,
                selectedTakeId: currentSelectedTakeId,
                editedBlobUrl
            };
            localStorage.setItem('aiVideoProject', JSON.stringify(project));
        } catch (e) {
            console.error("Failed to save project:", e);
        }
    }, 1000), []);

    useEffect(() => {
        if (isLoaded) {
             saveProject(script, visualStyle, takes, aiScenes, selectedTake?.id, editedBlob);
        }
    }, [script, visualStyle, takes, aiScenes, selectedTake, editedBlob, saveProject, isLoaded]);

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

                } catch (e) {
                    console.error("Failed to load project:", e);
                    localStorage.removeItem('aiVideoProject');
                }
            }
            setIsLoaded(true); // Mark loading as complete
        };
        loadProject();
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
    };

    const handleEditVideo = (take: Take) => {
        setSelectedTake(take);
        setAppState('editing');
    };

    const handleFinishEditing = (finalBlob: Blob) => {
        setEditedBlob(finalBlob);
        setAppState('composer');
    };
    
    const handleGenerateScenes = async () => {
        if (!script.trim()) {
            setError("Please write a script first.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const scenes = await generateVisualsForScript(script, visualStyle);
            setAiScenes(scenes);
            setAppState('composer');
        } catch (e) {
            console.error(e);
            setError("Failed to generate AI scenes. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderContent = () => {
        switch(appState) {
            case 'editing':
                if (!selectedTake) {
                    setAppState('main'); // Should not happen, but as a fallback
                    return null;
                }
                return <VideoEditor take={selectedTake} onFinishEditing={handleFinishEditing} onCancel={() => setAppState('main')} />;
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
                     <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <ScriptEditor 
                            script={script}
                            // FIX: Corrected prop names to match the ScriptEditorProps interface.
                            onScriptChange={setScript}
                            visualStyle={visualStyle}
                            setVisualStyle={setVisualStyle}
                            onSubmit={handleGenerateScenes}
                            isSubmitting={isLoading}
                            disabled={isLoading}
                        />
                        <VideoRecorder 
                            script={script}
                            takes={takes}
                            setTakes={setTakes}
                            onSelectTake={handleSelectTake}
                            onEditTake={handleEditVideo}
                            selectedTakeId={selectedTake?.id}
                        />
                    </div>
                );
        }
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans flex flex-col">
            <Header onNewProject={handleNewProject} />
            <main className="container mx-auto px-4 py-8 flex-grow flex items-start justify-center">
                 {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6 text-center fixed top-24 z-50">
                        <p>{error}</p>
                    </div>
                )}
                {renderContent()}
            </main>
        </div>
    );
};

export default App;
