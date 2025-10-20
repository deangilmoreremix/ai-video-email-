// FIX: Implement the Header component.
import React from 'react';
import { VideoIcon } from './icons';

interface HeaderProps {
    onNewProject: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNewProject }) => {
    return (
        <header className="py-6 relative">
            <div className="container mx-auto px-4 text-center">
                <div className="inline-flex items-center gap-3 bg-gray-800/50 border border-gray-700 px-6 py-3 rounded-full shadow-lg">
                    <VideoIcon className="w-8 h-8 text-yellow-400" />
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                        AI Video Assistant
                    </h1>
                </div>
                <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
                    Instantly create compelling video messages. Write a script (or have AI write one), record your message, and let AI generate stunning visuals to match.
                </p>
            </div>
            <div className="absolute top-6 right-6">
                <button
                    onClick={onNewProject}
                    className="px-4 py-2 text-sm bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                    title="Start a new project"
                >
                    Start New
                </button>
            </div>
        </header>
    );
};