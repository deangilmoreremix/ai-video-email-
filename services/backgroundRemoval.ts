import * as bodyPix from '@tensorflow-models/body-pix';
import '@tensorflow/tfjs';

let model: bodyPix.BodyPix | null = null;

export async function loadBackgroundRemovalModel(): Promise<void> {
  if (model) return;

  try {
    model = await bodyPix.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      multiplier: 0.75,
      quantBytes: 2,
    });
    console.log('BodyPix model loaded');
  } catch (error) {
    console.error('Failed to load BodyPix model:', error);
    throw error;
  }
}

export async function removeBackground(
  input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
  outputCanvas: HTMLCanvasElement,
  backgroundImage?: HTMLImageElement
): Promise<void> {
  if (!model) {
    await loadBackgroundRemovalModel();
  }

  if (!model) {
    throw new Error('BodyPix model not loaded');
  }

  const segmentation = await model.segmentPerson(input, {
    flipHorizontal: false,
    internalResolution: 'medium',
    segmentationThreshold: 0.7,
  });

  const ctx = outputCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  outputCanvas.width = input.width || (input as HTMLVideoElement).videoWidth;
  outputCanvas.height = input.height || (input as HTMLVideoElement).videoHeight;

  if (backgroundImage) {
    ctx.drawImage(backgroundImage, 0, 0, outputCanvas.width, outputCanvas.height);
  } else {
    ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
  }

  const imageData = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
  const pixels = imageData.data;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = outputCanvas.width;
  tempCanvas.height = outputCanvas.height;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.drawImage(input, 0, 0, outputCanvas.width, outputCanvas.height);
  const personData = tempCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);

  for (let i = 0; i < segmentation.data.length; i++) {
    const isPerson = segmentation.data[i];
    const pixelIndex = i * 4;

    if (isPerson) {
      pixels[pixelIndex] = personData.data[pixelIndex];
      pixels[pixelIndex + 1] = personData.data[pixelIndex + 1];
      pixels[pixelIndex + 2] = personData.data[pixelIndex + 2];
      pixels[pixelIndex + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

export async function blurBackground(
  input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
  outputCanvas: HTMLCanvasElement,
  blurAmount: number = 10
): Promise<void> {
  if (!model) {
    await loadBackgroundRemovalModel();
  }

  if (!model) {
    throw new Error('BodyPix model not loaded');
  }

  outputCanvas.width = input.width || (input as HTMLVideoElement).videoWidth;
  outputCanvas.height = input.height || (input as HTMLVideoElement).videoHeight;

  await bodyPix.drawBokehEffect(
    outputCanvas,
    input,
    await model.segmentPerson(input, {
      flipHorizontal: false,
      internalResolution: 'medium',
      segmentationThreshold: 0.7,
    }),
    blurAmount,
    3,
    false
  );
}

export async function applyBackgroundEffect(
  videoElement: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  effect: 'none' | 'blur' | 'remove',
  backgroundImage?: HTMLImageElement
): Promise<void> {
  if (effect === 'none') {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    }
    return;
  }

  if (effect === 'blur') {
    await blurBackground(videoElement, canvas, 15);
  } else if (effect === 'remove') {
    await removeBackground(videoElement, canvas, backgroundImage);
  }
}

export function disposeModel(): void {
  if (model) {
    model.dispose();
    model = null;
  }
}
