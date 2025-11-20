import React, { useState, useEffect, useRef } from 'react';
import { SendIcon, ShareIcon, CopyIcon } from './icons';
import { supabase } from '../lib/supabase';
import { uploadVideo, canUploadVideo, MAX_VIDEOS_PER_USER } from '../services/videoStorage';
import { triggerEmailSentEvent } from '../services/zapierWebhook';

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
    const [sending, setSending] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [videoSaved, setVideoSaved] = useState(false);

    useEffect(() => {
        const url = URL.createObjectURL(personalVideoBlob);
        setVideoUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [personalVideoBlob]);

    const handleSaveVideo = async () => {
        try {
            setSaveStatus('saving');
            setError(null);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Please sign in to save videos');
                setSaveStatus('error');
                return;
            }

            const canSave = await canUploadVideo();
            if (!canSave) {
                setError(`You have reached the maximum limit of ${MAX_VIDEOS_PER_USER} videos. Please delete some videos to save new ones.`);
                setSaveStatus('error');
                return;
            }

            await uploadVideo({
                videoName: `Video_${new Date().toISOString().split('T')[0]}`,
                videoBlob: personalVideoBlob,
                script,
                transcript: transcript || undefined,
                aiScenes: aiSceneUrls,
            });

            setSaveStatus('saved');
            setVideoSaved(true);
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err: any) {
            console.error('Error saving video:', err);
            setError(err.message);
            setSaveStatus('error');
        }
    };

    const handleSendEmail = async () => {
        if (!recipient) {
            setError('Please enter a recipient email address');
            return;
        }

        setSending(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                handleMailtoFallback();
                return;
            }

            const body = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <p>Hi,</p>
                    <p>I recorded a personal video message for you. You can view it using the link below.</p>
                    <p><strong>Video Link:</strong> <a href="${videoUrl}">Watch Video</a></p>
                    <hr/>
                    <h3>AI Generated Scenes</h3>
                    <p>Here are some AI-generated scenes based on the script:</p>
                    ${aiSceneUrls.map(url => `<img src="${url}" alt="AI Scene" style="max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 10px;" />`).join('')}
                    <hr/>
                    <h3>Script / Transcript</h3>
                    <pre style="white-space: pre-wrap; font-family: sans-serif; color: #333; background: #f5f5f5; padding: 15px; border-radius: 8px;">${transcript || script}</pre>
                </div>
            `;

            const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`;
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: recipient,
                    subject,
                    html: body,
                }),
            });

            const result = await response.json();

            if (result.useMailto) {
                handleMailtoFallback();
            } else if (!result.success) {
                throw new Error(result.error || 'Failed to send email');
            } else {
                await triggerEmailSentEvent({
                    to: recipient,
                    subject,
                    video_url: videoUrl,
                });
                alert('Email sent successfully!');
            }
        } catch (err: any) {
            console.error('Error sending email:', err);
            setError(err.message);
        } finally {
            setSending(false);
        }
    };

    const handleMailtoFallback = () => {
        const body = `
            Hi,

            I recorded a personal video message for you. Please find the video attached.

            AI Generated Scenes:
            ${aiSceneUrls.join('\n')}

            Script / Transcript:
            ${transcript || script}
        `;

        const a = document.createElement('a');
        a.href = videoUrl;
        a.download = 'video_message.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
        setSending(false);
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
        <div className="bg-gray-800 p-6 rounded-lg space-y-4 max-w-3xl mx-auto w-full" role="main" aria-label="Email Composer">
            <h2 className="text-2xl font-bold text-center">Your Video is Ready!</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="region" aria-label="Video Previews">
                <div>
                    <h3 className="font-semibold mb-2">Your Personal Intro</h3>
                    <video src={videoUrl} controls className="w-full rounded-lg bg-black aspect-video" aria-label="Your personal video introduction" />
                </div>
                <div>
                     <h3 className="font-semibold mb-2">AI Generated Scenes</h3>
                     <div className="aspect-video w-full bg-black rounded-lg overflow-y-auto" aria-label="AI generated scene carousel">
                        {aiSceneUrls.length > 0 ? (
                            aiSceneUrls.map((url, i) => <img key={i} src={url} alt={`AI Scene ${i+1}`} className="w-full h-auto mb-2" role="img"/>)
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">No AI scenes generated.</div>
                        )}
                     </div>
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-700" role="group" aria-label="Video Actions">
                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {saveStatus === 'saved' && (
                    <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-lg">
                        Video saved successfully!
                    </div>
                )}

                <div className="flex gap-4">
                    <button
                        onClick={handleSaveVideo}
                        disabled={saveStatus === 'saving' || videoSaved}
                        className="flex-1 px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saveStatus === 'saving' ? 'Saving...' : videoSaved ? 'Video Saved' : 'Save Video'}
                    </button>
                </div>

                <h3 className="font-semibold text-lg pt-4">Send Your Video</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input 
                        type="email" 
                        placeholder="Recipient's Email" 
                        value={recipient} 
                        onChange={e => setRecipient(e.target.value)} 
                        className="bg-gray-900 p-2 rounded-lg border border-gray-600 focus:ring-yellow-500"
                        aria-label="Recipient's Email Address"
                    />
                    <input 
                        type="text" 
                        placeholder="Subject" 
                        value={subject} 
                        onChange={e => setSubject(e.target.value)} 
                        className="bg-gray-900 p-2 rounded-lg border border-gray-600 focus:ring-yellow-500"
                        aria-label="Email Subject"
                    />
                </div>
                <div className="flex justify-between items-center gap-4">
                    <button 
                        onClick={onBack} 
                        className="px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-500"
                        aria-label="Back to video editor"
                    >
                        Back to Editor
                    </button>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleCopyShareLink} 
                            className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600" 
                            title="Copy Shareable Link (AI Scenes Only)"
                            aria-label="Copy shareable link for AI scenes"
                        >
                           <ShareIcon className="w-5 h-5"/>
                        </button>
                        <button
                            onClick={handleSendEmail}
                            disabled={sending}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Send email with video and AI scenes"
                        >
                           <SendIcon className="w-5 h-5"/>
                           <span>{sending ? 'Sending...' : 'Send Email'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Copy Confirmation Toast */}
            {showCopyToast && (
                <div 
                    className="fixed bottom-10 right-10 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
                    role="status"
                    aria-live="polite"
                >
                    <CopyIcon className="w-5 h-5" />
                    Link copied to clipboard!
                </div>
            )}
        </div>
    );
};