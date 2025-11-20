import React from 'react';
import { VideoIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    onNewProject: () => void;
    onOpenSettings: () => void;
    onOpenVideoLibrary: () => void;
    onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNewProject, onOpenSettings, onOpenVideoLibrary, onOpenAuth }) => {
    const { user, signOut } = useAuth();
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
            <div className="absolute top-6 right-6 flex gap-2">
                {user ? (
                    <>
                        <button
                            onClick={onOpenVideoLibrary}
                            className="px-4 py-2 text-sm bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                            title="Open video library"
                            aria-label="Open video library"
                        >
                            My Videos
                        </button>
                        <button
                            onClick={onOpenSettings}
                            className="px-4 py-2 text-sm bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                            title="Open settings"
                            aria-label="Open settings"
                        >
                            Settings
                        </button>
                        <button
                            onClick={onNewProject}
                            className="px-4 py-2 text-sm bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                            title="Start a new project"
                            aria-label="Start a new project, clearing current work"
                        >
                            Start New
                        </button>
                        <button
                            onClick={signOut}
                            className="px-4 py-2 text-sm bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 transition-colors"
                            title="Sign out"
                            aria-label="Sign out"
                        >
                            Sign Out
                        </button>
                    </>
                ) : (
                    <button
                        onClick={onOpenAuth}
                        className="px-4 py-2 text-sm bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
                        title="Sign in or sign up"
                        aria-label="Sign in or sign up"
                    >
                        Sign In
                    </button>
                )}
            </div>
        </header>
    );
};