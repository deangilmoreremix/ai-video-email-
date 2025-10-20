import { GoogleGenAI, Modality, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export type VisualStyle = 'Modern Tech' | 'Photorealistic' | 'Anime';

// --- Scripting ---
export const generateScriptFromPrompt = async (prompt: string): Promise<string> => {
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
    } catch (e) {
        console.error("Failed to parse keywords JSON:", e);
        return [];
    }
}

// --- Visuals ---
export const generateVisualsForScript = async (script: string, style: VisualStyle): Promise<string[]> => {
    const scenes = script.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const imagePromises: Promise<string>[] = [];

    const stylePrompt = {
        'Modern Tech': 'modern tech art style, clean, abstract, glowing data visualizations',
        'Photorealistic': 'photorealistic, cinematic lighting, 8k, sharp focus',
        'Anime': 'anime art style, vibrant colors, detailed background, dynamic'
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
};


// --- Video Analysis ---
export const generateTranscriptFromVideo = async (videoBlob: Blob): Promise<string> => {
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
    } catch (e) {
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
    } catch(e) {
        console.error("Failed to parse timed transcript:", jsonString, e);
        return { words: [], silences: [] };
    }
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
