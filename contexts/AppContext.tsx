import { createContext, useContext } from 'react';
import { GoogleGenAI } from '@google/genai';

// Interface for the initialized libraries
export interface AppContextType {
    ffmpeg: any | null;
    mediaPipeEffects: {
        segmenter: any;
        faceMesh: any;
        handLandmarker: any;
    } | null;
    getGoogleGenAIInstance: (requireAistudioKeySelection?: boolean) => Promise<GoogleGenAI>;
}

// The context to provide the initialized libraries
export const AppContext = createContext<AppContextType>({ 
    ffmpeg: null, 
    mediaPipeEffects: null, 
    // Provide a dummy implementation for context default value, 
    // it will be overridden by the actual implementation in App.tsx
    getGoogleGenAIInstance: async () => { throw new Error('GoogleGenAI not initialized'); }
});

// Custom hook for easy consumption of the context
export const useAppLibs = () => useContext(AppContext);