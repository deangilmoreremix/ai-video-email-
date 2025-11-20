import { getGoogleGenAIInstance } from './geminiService';

export interface Translation {
  languageCode: string;
  languageName: string;
  translatedScript: string;
  translatedSubject?: string;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ru', name: 'Russian' },
  { code: 'ko', name: 'Korean' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' }
];

export async function translateScript(
  script: string,
  targetLanguageCode: string,
  subject?: string
): Promise<Translation> {
  const genAI = getGoogleGenAIInstance();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const language = SUPPORTED_LANGUAGES.find(l => l.code === targetLanguageCode);
  if (!language) {
    throw new Error('Unsupported language');
  }

  const prompt = `Translate the following video script to ${language.name}.
Maintain the tone, style, and approximate length.
Adapt cultural references and idioms appropriately for ${language.name} speakers.

${subject ? `Subject line: "${subject}"\n` : ''}
Script: "${script}"

Return as JSON:
{
  "translatedScript": "...",
  ${subject ? '"translatedSubject": "..."' : ''}
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        languageCode: targetLanguageCode,
        languageName: language.name,
        translatedScript: parsed.translatedScript,
        translatedSubject: parsed.translatedSubject
      };
    }

    throw new Error('Failed to parse translation');
  } catch (error) {
    console.error('Error translating script:', error);
    throw error;
  }
}

export async function translateBatch(
  script: string,
  targetLanguageCodes: string[],
  subject?: string
): Promise<Translation[]> {
  const translations = await Promise.all(
    targetLanguageCodes.map(code => translateScript(script, code, subject))
  );
  return translations;
}
