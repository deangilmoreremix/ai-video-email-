import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export interface EmotionResult {
  expressions: {
    neutral: number;
    happy: number;
    sad: number;
    angry: number;
    fearful: number;
    disgusted: number;
    surprised: number;
  };
  dominantEmotion: string;
  confidence: number;
  ageApprox?: number;
  gender?: string;
  genderConfidence?: number;
}

export async function loadEmotionModels(): Promise<void> {
  if (modelsLoaded) return;

  try {
    const MODEL_URL = '/models';

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    ]);

    modelsLoaded = true;
    console.log('Face-api.js models loaded successfully');
  } catch (error) {
    console.error('Failed to load face-api.js models:', error);
    throw error;
  }
}

export async function detectEmotions(
  input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
): Promise<EmotionResult | null> {
  if (!modelsLoaded) {
    await loadEmotionModels();
  }

  try {
    const detection = await faceapi
      .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions()
      .withAgeAndGender();

    if (!detection) {
      return null;
    }

    const expressions = detection.expressions;
    const dominantEmotion = Object.keys(expressions).reduce((a, b) =>
      expressions[a as keyof typeof expressions] > expressions[b as keyof typeof expressions] ? a : b
    );

    return {
      expressions: {
        neutral: expressions.neutral,
        happy: expressions.happy,
        sad: expressions.sad,
        angry: expressions.angry,
        fearful: expressions.fearful,
        disgusted: expressions.disgusted,
        surprised: expressions.surprised,
      },
      dominantEmotion,
      confidence: expressions[dominantEmotion as keyof typeof expressions],
      ageApprox: detection.age ? Math.round(detection.age) : undefined,
      gender: detection.gender,
      genderConfidence: detection.genderProbability,
    };
  } catch (error) {
    console.error('Error detecting emotions:', error);
    return null;
  }
}

export async function analyzeVideoEmotions(
  videoElement: HTMLVideoElement,
  intervalMs: number = 1000
): Promise<EmotionResult[]> {
  const results: EmotionResult[] = [];
  const duration = videoElement.duration;
  const stepSize = intervalMs / 1000;

  for (let time = 0; time < duration; time += stepSize) {
    videoElement.currentTime = time;
    await new Promise(resolve => {
      videoElement.onseeked = () => resolve(null);
    });

    const emotion = await detectEmotions(videoElement);
    if (emotion) {
      results.push(emotion);
    }
  }

  return results;
}

export function getEmotionScore(emotions: EmotionResult[]): number {
  if (emotions.length === 0) return 0;

  const positiveEmotions = emotions.filter(
    e => e.dominantEmotion === 'happy' || e.dominantEmotion === 'neutral'
  );

  return (positiveEmotions.length / emotions.length) * 100;
}

export function getEngagementMetrics(emotions: EmotionResult[]): {
  averageConfidence: number;
  emotionalVariety: number;
  energyLevel: number;
} {
  if (emotions.length === 0) {
    return { averageConfidence: 0, emotionalVariety: 0, energyLevel: 0 };
  }

  const avgConfidence =
    emotions.reduce((sum, e) => sum + e.confidence, 0) / emotions.length;

  const uniqueEmotions = new Set(emotions.map(e => e.dominantEmotion));
  const emotionalVariety = (uniqueEmotions.size / 7) * 100;

  const energyEmotions = ['happy', 'surprised', 'angry'];
  const energyCount = emotions.filter(e =>
    energyEmotions.includes(e.dominantEmotion)
  ).length;
  const energyLevel = (energyCount / emotions.length) * 100;

  return {
    averageConfidence: avgConfidence * 100,
    emotionalVariety,
    energyLevel,
  };
}
