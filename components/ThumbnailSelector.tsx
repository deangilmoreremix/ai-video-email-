import React, { useState, useEffect } from 'react';
import { selectBestThumbnailFrame } from '../services/geminiService';

interface ThumbnailSelectorProps {
    videoBlob: Blob;
    videoUrl: string;
    onThumbnailSelected: (thumbnailDataUrl: string) => void;
    onClose: () => void;
}

export const ThumbnailSelector: React.FC<ThumbnailSelectorProps> = ({
    videoBlob,
    videoUrl,
    onThumbnailSelected,
    onClose
}) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [suggestedTimestamp, setSuggestedTimestamp] = useState<number | null>(null);
    const [customTimestamp, setCustomTimestamp] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [thumbnailPreviews, setThumbnailPreviews] = useState<string[]>([]);
    const [selectedPreview, setSelectedPreview] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const video = document.createElement('video');
        video.src = videoUrl;
        video.onloadedmetadata = () => {
            setDuration(video.duration);
            generateAutoPreviews(video);
        };
    }, [videoUrl]);

    const generateAutoPreviews = async (video: HTMLVideoElement) => {
        const previews: string[] = [];
        const timestamps = [0, video.duration * 0.25, video.duration * 0.5, video.duration * 0.75];

        for (const time of timestamps) {
            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 180;
            const ctx = canvas.getContext('2d');

            video.currentTime = time;
            await new Promise(resolve => {
                video.onseeked = resolve;
            });

            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                previews.push(canvas.toDataURL('image/jpeg', 0.8));
            }
        }

        setThumbnailPreviews(previews);
    };

    const handleAIAnalysis = async () => {
        setIsAnalyzing(true);
        setError('');
        try {
            const timestamp = await selectBestThumbnailFrame(videoBlob);
            setSuggestedTimestamp(timestamp);

            const thumbnail = await captureFrameAt(timestamp);
            setSelectedPreview(thumbnail);
            onThumbnailSelected(thumbnail);
        } catch (err: any) {
            setError(err.message || 'Failed to analyze video for best thumbnail');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const captureFrameAt = async (timestamp: number): Promise<string> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = videoUrl;
            video.currentTime = timestamp;

            video.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');

                if (ctx) {
                    ctx.drawImage(video, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg', 0.95));
                } else {
                    reject(new Error('Failed to get canvas context'));
                }
            };

            video.onerror = () => reject(new Error('Failed to load video'));
        });
    };

    const handleCustomCapture = async () => {
        try {
            const thumbnail = await captureFrameAt(customTimestamp);
            setSelectedPreview(thumbnail);
            onThumbnailSelected(thumbnail);
        } catch (err: any) {
            setError(err.message || 'Failed to capture frame');
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-4xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Select Video Thumbnail</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl"
                    >
                        ×
                    </button>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* AI Analysis Section */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <span>🤖</span> AI-Powered Thumbnail Selection
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                        Let AI analyze your video to find the frame with the best composition, lighting, and facial expression.
                    </p>
                    <button
                        onClick={handleAIAnalysis}
                        disabled={isAnalyzing}
                        className="w-full px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        {isAnalyzing ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                                Analyzing video...
                            </span>
                        ) : (
                            '✨ Find Best Thumbnail with AI'
                        )}
                    </button>
                    {suggestedTimestamp !== null && (
                        <p className="text-sm text-green-400 mt-2 text-center">
                            ✓ AI selected frame at {formatTime(suggestedTimestamp)}
                        </p>
                    )}
                </div>

                {/* Quick Preview Grid */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Quick Previews</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {thumbnailPreviews.map((preview, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setSelectedPreview(preview);
                                    onThumbnailSelected(preview);
                                }}
                                className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                    selectedPreview === preview
                                        ? 'border-yellow-400 ring-2 ring-yellow-400'
                                        : 'border-gray-600 hover:border-gray-500'
                                }`}
                            >
                                <img src={preview} alt={`Preview ${index + 1}`} className="w-full aspect-video object-cover" />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 px-2">
                                    {formatTime(duration * (index / 4))}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Time Selection */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Custom Time Selection</h3>
                    <div className="space-y-3">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="range"
                                    min="0"
                                    max={duration}
                                    step="0.1"
                                    value={customTimestamp}
                                    onChange={(e) => setCustomTimestamp(Number(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="text-sm text-gray-400 min-w-[50px]">
                                    {formatTime(customTimestamp)}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={handleCustomCapture}
                            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Capture Frame
                        </button>
                    </div>
                </div>

                {/* Selected Preview */}
                {selectedPreview && (
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                        <h3 className="font-semibold mb-3">Selected Thumbnail</h3>
                        <img
                            src={selectedPreview}
                            alt="Selected thumbnail"
                            className="w-full rounded-lg"
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            if (selectedPreview) {
                                onThumbnailSelected(selectedPreview);
                                onClose();
                            }
                        }}
                        disabled={!selectedPreview}
                        className="flex-1 px-6 py-3 bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50"
                    >
                        Use This Thumbnail
                    </button>
                </div>
            </div>
        </div>
    );
};
