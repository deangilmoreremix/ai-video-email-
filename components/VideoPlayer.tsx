
import React, { useState, useEffect, useRef } from 'react';

interface VideoPlayerProps {
    imageUrls: string[];
}

const FRAME_DURATION = 2500; // ms per image

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ imageUrls }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (isPlaying && imageUrls.length > 1) {
            intervalRef.current = window.setInterval(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % imageUrls.length);
            }, FRAME_DURATION);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isPlaying, imageUrls.length]);

    if (imageUrls.length === 0) {
        return <div className="aspect-video w-full bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">No images to display.</div>;
    }

    return (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg shadow-black/30">
            {imageUrls.map((url, index) => (
                <img
                    key={index}
                    src={url}
                    alt={`Scene ${index + 1}`}
                    className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
                />
            ))}
             <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {imageUrls.map((_, index) => (
                    <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${index === currentIndex ? 'bg-white' : 'bg-white/40'}`}
                    />
                ))}
            </div>
        </div>
    );
};
