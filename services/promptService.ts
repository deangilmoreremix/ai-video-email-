import { GoogleGenAI, Type } from "@google/genai";

export interface PromptImprovement {
  originalPrompt: string;
  improvedPrompt: string;
  suggestions: string[];
  qualityScore: number;
  missingElements: string[];
  improvements: string[];
}

export interface PromptVariation {
  prompt: string;
  style: string;
  focusArea: string;
}

export interface PromptAnalysis {
  clarity: number;
  specificity: number;
  completeness: number;
  overallScore: number;
  issues: string[];
  strengths: string[];
}

export interface PromptSuggestion {
  title: string;
  description: string;
  prompt: string;
  category: string;
  estimatedLength: number;
}

export const PROMPT_CATEGORIES = [
  'sales_pitch',
  'product_demo',
  'tutorial',
  'thank_you',
  'update',
  'welcome',
  'testimonial',
  'announcement',
  'explainer'
] as const;

export type PromptCategory = typeof PROMPT_CATEGORIES[number];

const getGeminiInstance = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenAI({ apiKey });
};

export const improvePrompt = async (
  originalPrompt: string,
  context?: {
    targetAudience?: string;
    videoPurpose?: string;
    tone?: string;
    keyMessage?: string;
    videoLength?: number;
  }
): Promise<PromptImprovement> => {
  const ai = getGeminiInstance();

  const contextInfo = context ? `
    Target Audience: ${context.targetAudience || 'General'}
    Video Purpose: ${context.videoPurpose || 'Informational'}
    Desired Tone: ${context.tone || 'Professional'}
    Key Message: ${context.keyMessage || 'Not specified'}
    Video Length: ${context.videoLength || 60} seconds
  ` : '';

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: `You are an expert video script prompt optimizer. Analyze this prompt and improve it to generate better video scripts.

Original Prompt: "${originalPrompt}"

${contextInfo ? `Additional Context:\n${contextInfo}` : ''}

Improve this prompt by:
1. Making it more specific and detailed
2. Adding clear structure (hook, body, call-to-action)
3. Specifying tone and style
4. Including target audience details
5. Adding emotional appeal elements
6. Making it actionable and clear

Return a JSON object with:
- "improvedPrompt" (string): The enhanced version of the prompt
- "suggestions" (array of strings): Specific improvements made
- "qualityScore" (number 0-100): Quality rating of the improved prompt
- "missingElements" (array of strings): Elements that were missing in the original
- "improvements" (array of strings): Brief explanation of each improvement

Make the improved prompt detailed enough to generate an engaging 60-90 second video script.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          improvedPrompt: { type: Type.STRING },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          qualityScore: { type: Type.NUMBER },
          missingElements: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvements: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  const result = JSON.parse(response.text.trim());
  return {
    originalPrompt,
    ...result
  };
};

export const generatePromptVariations = async (
  basePrompt: string,
  count: number = 3
): Promise<PromptVariation[]> => {
  const ai = getGeminiInstance();

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Generate ${count} different variations of this video script prompt, each with a different style and focus area.

Base Prompt: "${basePrompt}"

Create variations that:
1. Maintain the core message
2. Vary in tone (professional, friendly, urgent, casual)
3. Focus on different aspects (features, benefits, emotions, results)
4. Use different storytelling approaches

Return JSON array of objects with:
- "prompt" (string): The prompt variation
- "style" (string): The tone/style used
- "focusArea" (string): What this variation emphasizes`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING },
            style: { type: Type.STRING },
            focusArea: { type: Type.STRING }
          }
        }
      }
    }
  });

  return JSON.parse(response.text.trim());
};

export const analyzePromptQuality = async (prompt: string): Promise<PromptAnalysis> => {
  const ai = getGeminiInstance();

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Analyze this video script prompt for quality.

Prompt: "${prompt}"

Rate the prompt on these dimensions (0-100):
1. Clarity: How clear and understandable is the prompt?
2. Specificity: How detailed and specific is it?
3. Completeness: Does it include all necessary elements (audience, goal, tone, CTA)?

Return JSON with:
- "clarity" (number 0-100)
- "specificity" (number 0-100)
- "completeness" (number 0-100)
- "overallScore" (number 0-100): Average of the three scores
- "issues" (array of strings): Specific problems to fix
- "strengths" (array of strings): What the prompt does well`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          clarity: { type: Type.NUMBER },
          specificity: { type: Type.NUMBER },
          completeness: { type: Type.NUMBER },
          overallScore: { type: Type.NUMBER },
          issues: { type: Type.ARRAY, items: { type: Type.STRING } },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  return JSON.parse(response.text.trim());
};

export const generatePromptSuggestions = async (category: PromptCategory): Promise<PromptSuggestion[]> => {
  const ai = getGeminiInstance();

  const categoryDescriptions: Record<PromptCategory, string> = {
    sales_pitch: 'Introduce and sell a product/service',
    product_demo: 'Demonstrate product features and benefits',
    tutorial: 'Teach how to do something step-by-step',
    thank_you: 'Express gratitude and appreciation',
    update: 'Share news, updates, or announcements',
    welcome: 'Welcome new customers or team members',
    testimonial: 'Share customer success stories',
    announcement: 'Announce new features or changes',
    explainer: 'Explain a concept or process'
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Generate 5 example video script prompts for the category: ${category}

Category Description: ${categoryDescriptions[category]}

Each prompt should be:
- Specific and detailed
- Include clear objectives
- Specify target audience
- Mention desired tone
- Include a call-to-action

Return JSON array of objects with:
- "title" (string): Short descriptive title
- "description" (string): What this prompt creates
- "prompt" (string): The full prompt text
- "category" (string): "${category}"
- "estimatedLength" (number): Estimated video length in seconds`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            prompt: { type: Type.STRING },
            category: { type: Type.STRING },
            estimatedLength: { type: Type.NUMBER }
          }
        }
      }
    }
  });

  return JSON.parse(response.text.trim());
};

export const enhancePromptWithContext = async (
  basePrompt: string,
  enhancers: {
    addCTA?: boolean;
    addUrgency?: boolean;
    addPersonalization?: boolean;
    addStatistics?: boolean;
    addEmotionalAppeal?: boolean;
  }
): Promise<string> => {
  const ai = getGeminiInstance();

  const enhancements: string[] = [];
  if (enhancers.addCTA) enhancements.push('a strong call-to-action');
  if (enhancers.addUrgency) enhancements.push('urgency and time-sensitivity');
  if (enhancers.addPersonalization) enhancements.push('personalization elements');
  if (enhancers.addStatistics) enhancements.push('relevant statistics or data');
  if (enhancers.addEmotionalAppeal) enhancements.push('emotional appeal');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Enhance this video script prompt by adding: ${enhancements.join(', ')}.

Original Prompt: "${basePrompt}"

Return only the enhanced prompt text, keeping the core message but adding the specified elements naturally.`,
  });

  return response.text.trim();
};

export const getPromptAutocompleteSuggestions = async (
  partialPrompt: string
): Promise<string[]> => {
  if (partialPrompt.length < 10) return [];

  const ai = getGeminiInstance();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Given this incomplete video script prompt, suggest 3 ways to complete it.

Partial Prompt: "${partialPrompt}"

Return ONLY a JSON array of 3 completion suggestions (strings). Each should complete the thought naturally and make the prompt more effective.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error('Failed to get autocomplete suggestions:', error);
    return [];
  }
};
