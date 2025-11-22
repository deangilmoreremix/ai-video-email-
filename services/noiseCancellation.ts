export async function applyNoiseCancellation(
  inputStream: MediaStream
): Promise<MediaStream> {
  console.log('Noise cancellation requested - using browser noise suppression');

  const audioTracks = inputStream.getAudioTracks();
  if (audioTracks.length > 0) {
    try {
      const constraints = audioTracks[0].getConstraints();
      await audioTracks[0].applyConstraints({
        ...constraints,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
    } catch (error) {
      console.error('Failed to apply audio constraints:', error);
    }
  }

  return inputStream;
}

export function cleanupNoiseCancellation(): void {
  console.log('Noise cancellation cleanup');
}

export function isNoiseCancellationSupported(): boolean {
  return typeof MediaStreamTrack !== 'undefined' &&
         'applyConstraints' in MediaStreamTrack.prototype;
}
