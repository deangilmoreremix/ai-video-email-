import { RNNoiseProcessor } from '@timephy/rnnoise-wasm';

let processor: RNNoiseProcessor | null = null;
let audioContext: AudioContext | null = null;
let workletNode: AudioWorkletNode | null = null;

export async function initializeNoiseCancellation(): Promise<void> {
  if (processor) return;

  try {
    processor = await RNNoiseProcessor.create();
    console.log('RNNoise processor initialized');
  } catch (error) {
    console.error('Failed to initialize RNNoise:', error);
    throw error;
  }
}

export async function applyNoiseCancellation(
  inputStream: MediaStream
): Promise<MediaStream> {
  if (!processor) {
    await initializeNoiseCancellation();
  }

  if (!processor) {
    throw new Error('RNNoise processor not available');
  }

  audioContext = new AudioContext({ sampleRate: 48000 });
  const source = audioContext.createMediaStreamSource(inputStream);
  const destination = audioContext.createMediaStreamDestination();

  const processorNode = audioContext.createScriptProcessor(512, 1, 1);

  processorNode.onaudioprocess = (e) => {
    const inputData = e.inputBuffer.getChannelData(0);
    const outputData = e.outputBuffer.getChannelData(0);

    if (processor) {
      const cleaned = processor.process(inputData);
      outputData.set(cleaned);
    } else {
      outputData.set(inputData);
    }
  };

  source.connect(processorNode);
  processorNode.connect(destination);

  const videoTracks = inputStream.getVideoTracks();
  const processedStream = destination.stream;

  videoTracks.forEach(track => {
    processedStream.addTrack(track);
  });

  return processedStream;
}

export function cleanupNoiseCancellation(): void {
  if (workletNode) {
    workletNode.disconnect();
    workletNode = null;
  }

  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  if (processor) {
    processor.destroy();
    processor = null;
  }
}

export function isNoiseCancellationSupported(): boolean {
  return typeof AudioContext !== 'undefined' &&
         typeof AudioWorkletNode !== 'undefined';
}
