import React, { useState, useEffect, useRef } from 'react';
import { SendIcon, ShareIcon, CopyIcon } from './icons';

interface EmailComposerProps {
    personalVideoBlob: Blob;
    aiSceneUrls: string[];
    script: string;
    transcript: string | null;
    onBack: () => void;
}

export const EmailComposer: React.FC<EmailComposerProps> = ({ personalVideoBlob, aiSceneUrls, script, transcript, onBack }) => {
    const [videoUrl, setVideoUrl] = useState('');
    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState('A video message for you');
    const [showCopyToast, setShowCopyToast] = useState(false);

    useEffect(() => {
        const url = URL.createObjectURL(personalVideoBlob);
        setVideoUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [personalVideoBlob]);

    const handleSendEmail = () => {
        const body = `
            <p>Hi,</p>
            <p>I recorded a personal video message for you, which you can find attached to this email.</p>
            <br/>
            ---
            <h3>AI Generated Scenes</h3>
            <p>Here are some AI-generated scenes based on the script:</p>
            ${aiSceneUrls.map(url => `<img src="${url}" alt="AI Scene" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 10px;" />`).join('')}
            <br/>
            ---
            <h3>Script / Transcript</h3>
            <pre style="white-space: pre-wrap; font-family: sans-serif; color: #333;">${transcript || script}</pre>
            <br/>
            <p><em>To view the personal intro, please download and play the attached video file.</em></p>
        `;

        // Download the video file first
        const a = document.createElement('a');
        a.href = videoUrl;
        a.download = 'video_message.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Then open mailto link
        const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
    };
    
    const handleCopyShareLink = () => {
        // NOTE: This link will only contain the AI-generated parts, as the personal video blob is not shareable via URL.
        const shareData = {
            aiScenes: aiSceneUrls,
            script: script,
        };
        const base64Data = btoa(JSON.stringify(shareData));
        const shareUrl = `${window.location.origin}${window.location.pathname}#data=${base64Data}`;
        
        navigator.clipboard.writeText(shareUrl).then(() => {
            setShowCopyToast(true);
            setTimeout(() => setShowCopyToast(false), 3000);
        });
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg space-y-4 max-w-3xl mx-auto w-full">
            <h2 className="text-2xl font-bold text-center">Your Video is Ready!</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h3 className="font-semibold mb-2">Your Personal Intro</h3>
                    <video src={videoUrl} controls className="w-full rounded-lg bg-black aspect-video" />
                </div>
                <div>
                     <h3 className="font-semibold mb-2">AI Generated Scenes</h3>
                     <div className="aspect-video w-full bg-black rounded-lg overflow-y-auto">
                        {aiSceneUrls.length > 0 ? (
                            aiSceneUrls.map((url, i) => <img key={i} src={url} alt={`Scene ${i+1}`} className="w-full h-auto mb-2"/>)
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">No AI scenes generated.</div>
                        )}
                     </div>
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-700">
                <h3 className="font-semibold text-lg">Send Your Video</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="email" placeholder="Recipient's Email" value={recipient} onChange={e => setRecipient(e.target.value)} className="bg-gray-900 p-2 rounded-lg border border-gray-600 focus:ring-yellow-500"/>
                    <input type="text" placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} className="bg-gray-900 p-2 rounded-lg border border-gray-600 focus:ring-yellow-500"/>
                </div>
                <div className="flex justify-between items-center gap-4">
                    <button onClick={onBack} className="px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-500">Back to Editor</button>
                    <div className="flex gap-2">
                        <button onClick={handleCopyShareLink} className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600" title="Copy Shareable Link (AI Scenes Only)">
                           <ShareIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={handleSendEmail} className="inline-flex items-center gap-2 px-6 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400">
                           <SendIcon className="w-5 h-5"/>
                           <span>Send Email</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Copy Confirmation Toast */}
            {showCopyToast && (
                <div className="fixed bottom-10 right-10 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <CopyIcon className="w-5 h-5" />
                    Link copied to clipboard!
                </div>
            )}
        </div>
    );
};
