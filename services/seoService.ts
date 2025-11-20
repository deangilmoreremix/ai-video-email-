import { getGoogleGenAIInstance } from './geminiService';

export interface SEOMetadata {
  optimizedTitle: string;
  description: string;
  keywords: string[];
  suggestedHashtags: string[];
}

export interface EngagementPreview {
  score: number;
  wordCount: number;
  optimalRange: [number, number];
  hasHook: boolean;
  hasCTA: boolean;
  pacingWordsPerMinute: number;
  recommendations: string[];
}

export async function generateSEOTitle(script: string): Promise<SEOMetadata> {
  const genAI = getGoogleGenAIInstance();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `Analyze this video script and generate SEO metadata:

Script: "${script}"

Generate:
1. An optimized title (max 60 characters, keyword-rich, compelling)
2. A description (max 160 characters)
3. 5-10 relevant keywords
4. 3-5 hashtags for social media

Return as JSON:
{
  "optimizedTitle": "...",
  "description": "...",
  "keywords": ["...", "..."],
  "suggestedHashtags": ["#...", "#..."]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Failed to parse SEO metadata');
  } catch (error) {
    console.error('Error generating SEO metadata:', error);
    throw error;
  }
}

export async function predictEngagement(script: string): Promise<EngagementPreview> {
  const genAI = getGoogleGenAIInstance();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `Analyze this video script for engagement potential:

Script: "${script}"

Evaluate:
1. Overall engagement score (0-100)
2. Word count and if it's in optimal range (120-180 words for 60-90 seconds)
3. Does it have a strong opening hook?
4. Does it have a clear call-to-action?
5. Estimated speaking pace (words per minute, optimal is 140-160)
6. 3-5 specific recommendations to improve engagement

Return as JSON:
{
  "score": 75,
  "wordCount": 150,
  "optimalRange": [120, 180],
  "hasHook": true,
  "hasCTA": false,
  "pacingWordsPerMinute": 150,
  "recommendations": ["Add a clear CTA at the end", "..."]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Failed to parse engagement prediction');
  } catch (error) {
    console.error('Error predicting engagement:', error);
    throw error;
  }
}
