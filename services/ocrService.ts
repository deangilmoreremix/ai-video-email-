import Tesseract from 'tesseract.js';

let worker: Tesseract.Worker | null = null;

export async function initializeOCR(language: string = 'eng'): Promise<void> {
  if (worker) return;

  try {
    worker = await Tesseract.createWorker(language, 1, {
      logger: (m) => console.log('OCR:', m),
    });
    console.log('Tesseract OCR initialized');
  } catch (error) {
    console.error('Failed to initialize OCR:', error);
    throw error;
  }
}

export async function extractTextFromImage(
  image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | string
): Promise<string> {
  if (!worker) {
    await initializeOCR();
  }

  if (!worker) {
    throw new Error('OCR worker not available');
  }

  try {
    const { data } = await worker.recognize(image);
    return data.text;
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
}

export async function extractTextFromVideo(
  videoElement: HTMLVideoElement,
  intervalSeconds: number = 5
): Promise<{ timestamp: number; text: string }[]> {
  const results: { timestamp: number; text: string }[] = [];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const duration = videoElement.duration;

  for (let time = 0; time < duration; time += intervalSeconds) {
    videoElement.currentTime = time;

    await new Promise<void>((resolve) => {
      videoElement.onseeked = () => resolve();
    });

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    try {
      const text = await extractTextFromImage(canvas);
      if (text.trim().length > 0) {
        results.push({ timestamp: time, text: text.trim() });
      }
    } catch (error) {
      console.error(`Error extracting text at ${time}s:`, error);
    }
  }

  return results;
}

export async function detectTextInFrame(
  image: HTMLImageElement | HTMLCanvasElement
): Promise<{
  text: string;
  confidence: number;
  words: { text: string; confidence: number; bbox: { x: number; y: number; width: number; height: number } }[];
}> {
  if (!worker) {
    await initializeOCR();
  }

  if (!worker) {
    throw new Error('OCR worker not available');
  }

  try {
    const { data } = await worker.recognize(image);

    return {
      text: data.text,
      confidence: data.confidence,
      words: data.words.map(word => ({
        text: word.text,
        confidence: word.confidence,
        bbox: {
          x: word.bbox.x0,
          y: word.bbox.y0,
          width: word.bbox.x1 - word.bbox.x0,
          height: word.bbox.y1 - word.bbox.y0,
        },
      })),
    };
  } catch (error) {
    console.error('Error detecting text:', error);
    throw error;
  }
}

export async function terminateOCR(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}

export function isOCRSupported(): boolean {
  return typeof Worker !== 'undefined';
}
