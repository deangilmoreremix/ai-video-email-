
import React from 'react';

export const Loader: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-lg text-gray-300 font-semibold">Generating your visual story...</p>
            <p className="mt-2 text-sm text-gray-500">This may take a moment.</p>
        </div>
    );
};
