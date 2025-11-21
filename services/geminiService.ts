
import { GoogleGenAI, Modality, Type, GenerateContentResponse, FunctionDeclaration, LiveServerMessage } from "@google/genai";

declare const window: any;

// A mutable reference to the GoogleGenAI instance.
// This allows re-initialization if the API key selection changes.
let aiInstance: GoogleGenAI | null = null;
let lastSelectedApiKey: string | null = null; // Track the last API key used to prevent unnecessary re-initialization

/**
 * Provides a GoogleGenAI instance, ensuring API key selection for specific models.
 * For Veo models, it will prompt the user to select an API key if not already selected.
 * @param requireAistudioKeySelection If true, checks for `window.aistudio` API key selection.
 *                                    This should only be true for models like Veo that require it.
 * @returns A promise that resolves to a GoogleGenAI instance.
 */
export const getGoogleGenAIInstance = async (
    requireAistudioKeySelection: boolean = false
): Promise<GoogleGenAI> => {
    // Check if the current environment's API_KEY has changed or if an instance hasn't been created yet.
    // This allows for dynamic API key updates without full page reload.
    const currentEnvApiKey = import.meta.env.VITE_GEMINI_API_KEY || null;

    if (requireAistudioKeySelection) {
        if (!window.aistudio) {
            console.warn("window.aistudio not available, cannot check for API key selection for Veo models.");
            // Fallback to environment key or throw error if strictly required.
            // For now, we'll proceed with the environment key if window.aistudio is absent.
            if (!aiInstance || lastSelectedApiKey !== currentEnvApiKey) {
                aiInstance = new GoogleGenAI({ apiKey: currentEnvApiKey! });
                lastSelectedApiKey = currentEnvApiKey;
            }
            return aiInstance;
        }

        let hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            console.log("No API key selected. Opening key selection dialog...");
            try {
                // Open the key selection dialog. The user will interact with it.
                await window.aistudio.openSelectKey();
                // Optimistically assume key selection was successful.
                hasKey = true;
                // Since the key selection might have changed the API key, we re-evaluate.
                const newEnvApiKey = import.meta.env.VITE_GEMINI_API_KEY || null;
                if (!aiInstance || lastSelectedApiKey !== newEnvApiKey) {
                    aiInstance = new GoogleGenAI({ apiKey: newEnvApiKey! });
                    lastSelectedApiKey = newEnvApiKey;
                }
                return aiInstance;
            } catch (error: any) {
                console.error("User cancelled or failed to select API key:", error);
                // If API call fails later due to missing key, aistudio.openSelectKey() might need to be called again.
                // For now, re-throw to indicate the feature cannot proceed without key.
                throw new Error("API key selection is required to use this feature.");
            }
        }
    }

    // Default behavior for other models: use VITE_GEMINI_API_KEY.
    // Re-initialize only if API key has changed or instance is null.
    if (!aiInstance || lastSelectedApiKey !== currentEnvApiKey) {
        if (!currentEnvApiKey) {
            console.error("GEMINI_API_KEY is not set. Ensure VITE_GEMINI_API_KEY is configured in your .env file.");
            throw new Error("GEMINI_API_KEY is not configured.");
        }
        aiInstance = new GoogleGenAI({ apiKey: currentEnvApiKey });
        lastSelectedApiKey = currentEnvApiKey;
    }
    return aiInstance;
};

// --- Scripting ---
export const generateScriptFromPrompt = async (prompt: string): Promise<string> => {
    const ai = await getGoogleGenAIInstance(false); // No aistudio key selection needed for this model
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Write a short, compelling video script based on the following prompt. The script should be concise and engaging, suitable for a short video message of 2-4 sentences. Prompt: "${prompt}"`,
        config: {
            systemInstruction: "You are an expert scriptwriter for short-form video content."
        }
    });
    return response.text.trim();
};

export const getKeywordsFromScript = async (script: string): Promise<string[]> => {
    const ai = await getGoogleGenAIInstance(false); // No aistudio key selection needed for this model
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following script and identify the most important keywords or short phrases (2-3 words max). Return ONLY a JSON array of strings. Script: "${script}"`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });
    const jsonString = response.text.trim();
    try {
        return JSON.parse(jsonString);
    } catch (e: any) {
        console.error("Failed to parse keywords JSON:", e);
        return [];
    }
}

// --- Visuals ---
export type VisualStyle = 'Modern Tech' | 'Photorealistic' | 'Anime' | 'Cinematic' | 'Minimalist' | 'Corporate' | 'Vibrant' | 'Dark Mode';

export const generateVisualsForScript = async (script: string, style: VisualStyle): Promise<string[]> => {
    return retryWithBackoff(async () => {
        try {
            const ai = await getGoogleGenAIInstance(false);
            const scenes = script.split(/[.!?]+/).filter(s => s.trim().length > 0);
            const imagePromises: Promise<string>[] = [];

            const stylePrompt = {
                'Modern Tech': 'modern tech art style, clean, abstract, glowing data visualizations, futuristic',
                'Photorealistic': 'photorealistic, cinematic lighting, 8k, sharp focus, professional photography',
                'Anime': 'anime art style, vibrant colors, detailed background, dynamic, expressive',
                'Cinematic': 'cinematic movie-quality, dramatic lighting, film grain, color grading, widescreen',
                'Minimalist': 'minimalist design, clean lines, simple composition, negative space, elegant',
                'Corporate': 'professional corporate style, clean, business-appropriate, sophisticated, modern office',
                'Vibrant': 'vibrant bold colors, high contrast, energetic, eye-catching, dynamic composition',
                'Dark Mode': 'dark moody aesthetic, low-key lighting, deep shadows, dramatic contrast, noir'
            }[style];

            for (const scene of scenes) {
                const promise = ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: {
                        parts: [{ text: `Generate a visually stunning image in a ${stylePrompt}. Scene: "${scene}"` }],
                    },
                    config: {
                        responseModalities: [Modality.IMAGE],
                    },
                }).then(response => {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData) {
                            return `data:image/png;base64,${part.inlineData.data}`;
                        }
                    }
                    throw new Error('Image data not found in response');
                });
                imagePromises.push(promise);
            }
            return Promise.all(imagePromises);
        } catch (error) {
            return handleGeminiError(error);
        }
    });
};


// --- Video Analysis ---
export const generateTranscriptFromVideo = async (videoBlob: Blob): Promise<string> => {
    const ai = await getGoogleGenAIInstance(false); // No aistudio key selection needed for this model
    const videoBase64 = await blobToDataURL(videoBlob);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [{
            parts: [
                { text: "Generate a transcript for this video." },
                { inlineData: { mimeType: videoBlob.type, data: videoBase64.split(',')[1] } }
            ]
        }]
    });
    return response.text.trim();
};

export const analyzeTranscriptForQuality = async (transcript: string): Promise<{ score: number, justification: string }> => {
    const ai = await getGoogleGenAIInstance(false); // No aistudio key selection needed for this model
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Act as a speech coach. Analyze the following transcript for clarity, confidence, and delivery (e.g., filler words, rambling). Provide a score out of 10 and a brief, one-sentence justification. Return ONLY a JSON object with "score" (number) and "justification" (string). Transcript: "${transcript}"`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER },
                    justification: { type: Type.STRING }
                }
            }
        }
    });
    const jsonString = response.text.trim();
    try {
        return JSON.parse(jsonString);
    } catch (e: any) {
        console.error("Failed to parse analysis JSON:", jsonString, e);
        // Fallback in case of parsing error
        return { score: 0, justification: "Could not analyze." };
    }
};

export interface Word {
    word: string;
    start: number;
    end: number;
    isFiller: boolean;
}
export interface Silence {
    start: number;
    end: number;
    duration: number;
}
export interface TimedTranscript {
    words: Word[];
    silences: Silence[];
}

export const getTranscriptWithTimestampsAndFillers = async (videoBlob: Blob): Promise<TimedTranscript> => {
    const ai = await getGoogleGenAIInstance(false); // No aistudio key selection needed for this model
    const videoBase64 = await blobToDataURL(videoBlob);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [{
            parts: [
                { text: "Analyze this video. Provide a word-by-word transcript with start and end timestamps. Identify filler words (like 'um', 'ah', 'uh', 'like', 'you know'). Also, identify any silences longer than 1 second with their start and end timestamps. Return ONLY a JSON object with two keys: 'words' (an array of objects with 'word', 'start', 'end', 'isFiller' keys) and 'silences' (an array of objects with 'start', 'end', 'duration' keys)." },
                { inlineData: { mimeType: videoBlob.type, data: videoBase64.split(',')[1] } }
            ]
        }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    words: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                word: { type: Type.STRING },
                                start: { type: Type.NUMBER },
                                end: { type: Type.NUMBER },
                                isFiller: { type: Type.BOOLEAN },
                            }
                        }
                    },
                    silences: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                start: { type: Type.NUMBER },
                                end: { type: Type.NUMBER },
                                duration: { type: Type.NUMBER },
                            }
                        }
                    }
                }
            }
        }
    });
    const jsonString = response.text.trim();
    try {
        return JSON.parse(jsonString);
    } catch(e: any) {
        console.error("Failed to parse timed transcript:", jsonString, e);
        return { words: [], silences: [] };
    }
};


// --- AI Enhancement Features ---

export interface ScriptImprovement {
    improvedScript: string;
    suggestions: string[];
    improvementScore: number;
}

export const improveScript = async (script: string): Promise<ScriptImprovement> => {
    const ai = await getGoogleGenAIInstance(false);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Analyze this video script and provide improvements for clarity, engagement, and persuasiveness. Return a JSON object with: "improvedScript" (the improved version), "suggestions" (array of specific improvements made), and "improvementScore" (0-100 rating of how much better it is). Script: "${script}"`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    improvedScript: { type: Type.STRING },
                    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    improvementScore: { type: Type.NUMBER }
                }
            }
        }
    });
    return JSON.parse(response.text.trim());
};

export interface SentimentAnalysis {
    sentiment: 'professional' | 'friendly' | 'urgent' | 'casual' | 'formal';
    confidence: number;
    suggestions: string[];
}

export const analyzeSentiment = async (text: string): Promise<SentimentAnalysis> => {
    const ai = await getGoogleGenAIInstance(false);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the tone and sentiment of this text. Return JSON with: "sentiment" (one of: professional, friendly, urgent, casual, formal), "confidence" (0-1), and "suggestions" (array of tips to improve tone). Text: "${text}"`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    sentiment: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        }
    });
    return JSON.parse(response.text.trim());
};

export const generateEmailSubjectLines = async (script: string, recipientName?: string): Promise<string[]> => {
    const ai = await getGoogleGenAIInstance(false);
    const context = recipientName ? ` for ${recipientName}` : '';
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate 5 compelling email subject lines${context} based on this video script. Make them engaging, personalized, and likely to be opened. Return ONLY a JSON array of strings. Script: "${script}"`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });
    return JSON.parse(response.text.trim());
};

export interface PersonalizedEmail {
    greeting: string;
    body: string;
    callToAction: string;
}

export const personalizeEmailContent = async (
    script: string,
    recipientName: string,
    recipientCompany?: string,
    recipientRole?: string
): Promise<PersonalizedEmail> => {
    const ai = await getGoogleGenAIInstance(false);
    const context = `Recipient: ${recipientName}${recipientCompany ? `, Company: ${recipientCompany}` : ''}${recipientRole ? `, Role: ${recipientRole}` : ''}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Create a personalized email based on this video script. ${context}. Return JSON with: "greeting" (personalized greeting), "body" (2-3 sentences introducing the video), "callToAction" (what you want them to do next). Script: "${script}"`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    greeting: { type: Type.STRING },
                    body: { type: Type.STRING },
                    callToAction: { type: Type.STRING }
                }
            }
        }
    });
    return JSON.parse(response.text.trim());
};

export interface VideoOptimization {
    optimalLength: number;
    currentLength: number;
    segmentsToTrim: Array<{ start: number; end: number; reason: string }>;
    keepSegments: Array<{ start: number; end: number; reason: string }>;
}

export const analyzeVideoLength = async (videoBlob: Blob, targetLength?: number): Promise<VideoOptimization> => {
    const ai = await getGoogleGenAIInstance(false);
    const videoBase64 = await blobToDataURL(videoBlob);
    const target = targetLength || 60;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [{
            parts: [
                { text: `Analyze this video and suggest optimal length (target: ${target} seconds). Identify segments to trim and key segments to keep. Return JSON with: "optimalLength" (seconds), "currentLength" (seconds), "segmentsToTrim" (array with start, end, reason), "keepSegments" (array with start, end, reason).` },
                { inlineData: { mimeType: videoBlob.type, data: videoBase64.split(',')[1] } }
            ]
        }],
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    optimalLength: { type: Type.NUMBER },
                    currentLength: { type: Type.NUMBER },
                    segmentsToTrim: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                start: { type: Type.NUMBER },
                                end: { type: Type.NUMBER },
                                reason: { type: Type.STRING }
                            }
                        }
                    },
                    keepSegments: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                start: { type: Type.NUMBER },
                                end: { type: Type.NUMBER },
                                reason: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        }
    });
    return JSON.parse(response.text.trim());
};

export const recommendAdditionalScenes = async (script: string, existingScenes: string[]): Promise<string[]> => {
    const ai = await getGoogleGenAIInstance(false);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on this script, recommend 3-5 additional B-roll scene descriptions that would enhance the storytelling. Avoid duplicating these existing scenes: ${existingScenes.join(', ')}. Return ONLY a JSON array of scene descriptions. Script: "${script}"`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });
    return JSON.parse(response.text.trim());
};

export const selectBestThumbnailFrame = async (videoBlob: Blob): Promise<number> => {
    const ai = await getGoogleGenAIInstance(false);
    const videoBase64 = await blobToDataURL(videoBlob);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [{
            parts: [
                { text: 'Analyze this video and identify the timestamp (in seconds) of the frame that would make the best thumbnail. Look for: clear face, good expression, good lighting, engaging composition. Return ONLY a JSON object with "timestamp" (number in seconds).' },
                { inlineData: { mimeType: videoBlob.type, data: videoBase64.split(',')[1] } }
            ]
        }],
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    timestamp: { type: Type.NUMBER }
                }
            }
        }
    });
    const result = JSON.parse(response.text.trim());
    return result.timestamp;
};

export interface CaptionSegment {
    text: string;
    start: number;
    end: number;
}

export const generateClosedCaptions = async (videoBlob: Blob): Promise<CaptionSegment[]> => {
    const ai = await getGoogleGenAIInstance(false);
    const videoBase64 = await blobToDataURL(videoBlob);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [{
            parts: [
                { text: 'Generate closed captions for this video with precise timestamps. Break captions into short segments (5-10 words each) suitable for display. Return JSON array of objects with "text", "start" (seconds), "end" (seconds).' },
                { inlineData: { mimeType: videoBlob.type, data: videoBase64.split(',')[1] } }
            ]
        }],
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING },
                        start: { type: Type.NUMBER },
                        end: { type: Type.NUMBER }
                    }
                }
            }
        }
    });
    return JSON.parse(response.text.trim());
};

// --- Error Handling ---

export class GeminiAPIError extends Error {
    constructor(
        message: string,
        public code?: string,
        public statusCode?: number,
        public retryAfter?: number
    ) {
        super(message);
        this.name = 'GeminiAPIError';
    }
}

export const handleGeminiError = (error: any): never => {
    if (error.message?.includes('quota')) {
        throw new GeminiAPIError(
            'API quota exceeded. Please try again later or check your Gemini API usage limits at https://aistudio.google.com/apikey',
            'QUOTA_EXCEEDED',
            429
        );
    }

    if (error.message?.includes('429') || error.statusCode === 429) {
        throw new GeminiAPIError(
            'Too many requests. Please wait a moment before trying again.',
            'RATE_LIMITED',
            429,
            60
        );
    }

    if (error.message?.includes('401') || error.message?.includes('API key')) {
        throw new GeminiAPIError(
            'Invalid API key. Please check your Gemini API key configuration.',
            'INVALID_API_KEY',
            401
        );
    }

    if (error.message?.includes('403')) {
        throw new GeminiAPIError(
            'Access forbidden. Your API key may not have permission for this operation.',
            'FORBIDDEN',
            403
        );
    }

    throw new GeminiAPIError(
        error.message || 'An unknown error occurred with the Gemini API',
        'UNKNOWN_ERROR'
    );
};

export const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
): Promise<T> => {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            if (error.code === 'QUOTA_EXCEEDED' || error.code === 'INVALID_API_KEY' || error.code === 'FORBIDDEN') {
                throw error;
            }

            if (i < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, i);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
};

// --- Utility Functions ---
export const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const base64ToBlob = async (dataUrl: string): Promise<Blob> => {
    const res = await fetch(dataUrl);
    return await res.blob();
};
