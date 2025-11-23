import * as geminiService from './geminiService';
import { apiQueue } from './apiQueueService';

export const generateScriptFromPrompt = async (prompt: string): Promise<string> => {
    return apiQueue.makeRequest(
        'gemini',
        'gemini-2.5-pro',
        async () => geminiService.generateScriptFromPrompt(prompt),
        'generate_script'
    );
};

export const getKeywordsFromScript = async (script: string): Promise<string[]> => {
    return apiQueue.makeRequest(
        'gemini',
        'gemini-2.5-flash',
        async () => geminiService.getKeywordsFromScript(script),
        'get_keywords'
    );
};

export const generateVisualsForScript = async (
    script: string,
    style: geminiService.VisualStyle
): Promise<string[]> => {
    return apiQueue.makeRequest(
        'gemini',
        'gemini-2.5-flash-image',
        async () => geminiService.generateVisualsForScript(script, style),
        'generate_visuals'
    );
};

export const generateTranscriptFromVideo = async (videoBlob: Blob): Promise<string> => {
    return apiQueue.makeRequest(
        'gemini',
        'gemini-2.5-pro',
        async () => geminiService.generateTranscriptFromVideo(videoBlob),
        'generate_transcript'
    );
};

export const analyzeTranscriptForQuality = async (
    transcript: string
): Promise<{ score: number; justification: string }> => {
    return apiQueue.makeRequest(
        'gemini',
        'gemini-2.5-flash',
        async () => geminiService.analyzeTranscriptForQuality(transcript),
        'analyze_transcript'
    );
};

export const generateTimelineFromTranscript = async (
    transcript: string,
    duration: number
): Promise<geminiService.Word[]> => {
    return apiQueue.makeRequest(
        'gemini',
        'gemini-2.5-flash',
        async () => geminiService.generateTimelineFromTranscript(transcript, duration),
        'generate_timeline'
    );
};

export * from './geminiService';
