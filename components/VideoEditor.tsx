import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppLibs } from '../contexts/AppContext';
import { Take } from './VideoRecorder';
import { getTranscriptWithTimestampsAndFillers, TimedTranscript } from '../services/geminiService';
import { ScissorsIcon, MuteIcon, PlayIcon, TrashIcon } from './icons';
import { supabase } from '../lib/supabase';

interface VideoEditorProps {
    take: Take;
    onFinishEditing: (editedBlob: Blob) => void;
    onCancel: () => void;
    onError: (message: string) => void;
    onCreateCampaign?: (editedBlob: Blob) => void;
    editingFromLibrary?: boolean;
}

type Cut = { id: string; start: number; end: number; type: 'filler' | 'silence' | 'manual'; text?: string };

export const VideoEditor: React.FC<VideoEditorProps> = ({ take, onFinishEditing, onCancel, onError, onCreateCampaign, editingFromLibrary = false }) => {
    const { ffmpeg, getGoogleGenAIInstance } = useAppLibs();
    const videoRef = useRef<HTMLVideoElement>(null);
    const waveformRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timedTranscript, setTimedTranscript] = useState<TimedTranscript | null>(null);
    const [cuts, setCuts] = useState<Cut[]>([]);
    const [manualCuts, setManualCuts] = useState<Cut[]>([]);
    
    const [duration, setDuration] = useState(0);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);

    const [manualCutStart, setManualCutStart] = useState('');
    const [manualCutEnd, setManualCutEnd] = useState('');
    
    const [isSaving, setIsSaving] = useState(false);
    const [saveProgress, setSaveProgress] = useState(0);
    const [exportFormat, setExportFormat] = useState<'mp4' | 'gif'>('mp4');
    const [resolution, setResolution] = useState('720p');
    const [frameRate, setFrameRate] = useState('30');

    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const isDraggingTrimStart = useRef(false);
    const isDraggingTrimEnd = useRef(false);

    const saveEditedVideoToLibrary = async (videoBlob: Blob) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('User must be authenticated to save videos');
            }

            const fileName = `${Date.now()}_edited_${take.id}.${exportFormat === 'mp4' ? 'mp4' : 'gif'}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('videos')
                .upload(filePath, videoBlob);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('videos')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('user_videos')
                .update({
                    video_url: publicUrl,
                    file_size: videoBlob.size,
                })
                .eq('id', take.id);

            if (updateError) {
                await supabase.storage.from('videos').remove([filePath]);
                throw updateError;
            }

            onError('Video saved to library successfully!');
        } catch (error: any) {
            console.error('Error saving edited video:', error);
            onError(`Failed to save video: ${error.message}`);
            throw error;
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds - Math.floor(seconds)) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    // Moved getAllCuts before drawWaveform and useEffect that depend on it
    const getAllCuts = useCallback(() => {
        return [...cuts, ...manualCuts]
            .sort((a, b) => a.start - b.start)
            .filter(cut => {
                const toggle = document.getElementById(`cut-${cut.id}`) as HTMLInputElement;
                return toggle ? toggle.checked : true; // Only include if checkbox is checked
            });
    }, [cuts, manualCuts]);

    // Wrapped drawWaveform in useCallback and listed its dependencies
    const drawWaveform = useCallback(() => {
        const canvas = waveformRef.current;
        if (!canvas || !audioBufferRef.current || !duration) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const data = audioBufferRef.current.getChannelData(0);
        const width = canvas.width;
        const height = canvas.height;
        const step = Math.ceil(data.length / width); // Number of samples per pixel column
        const amp = height / 2; // Amplitude for waveform drawing

        ctx.clearRect(0, 0, width, height);
        
        ctx.fillStyle = '#1f2937'; // Dark background for the waveform
        ctx.fillRect(0,0,width,height);

        ctx.fillStyle = '#6b7280'; // Waveform color
        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            const offset = i * step;
            for (let j = 0; j < step; j++) {
                const datum = data[offset + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            // Draw a vertical bar for each column representing the min/max amplitude
            ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp)); // Ensure minimum height of 1px
        }
        
        const allCuts = getAllCuts();
        allCuts.forEach(cut => {
            const startX = (cut.start / duration) * width;
            const endX = (cut.end / duration) * width;
            ctx.fillStyle = cut.type === 'silence' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(239, 68, 68, 0.5)';
            ctx.fillRect(startX, 0, endX - startX, height);
        });

        const trimStartX = (trimStart / duration) * width;
        const trimEndX = (trimEnd / duration) * width;
        
        // Dim outside trim area
        ctx.fillStyle = 'rgba(250, 204, 21, 0.2)'; // Yellow tint
        ctx.fillRect(0, 0, trimStartX, height); // Left dim
        ctx.fillRect(trimEndX, 0, width - trimEndX, height); // Right dim

        // Draw trim handles
        ctx.fillStyle = '#facc15'; // Yellow
        ctx.fillRect(trimStartX - 2, 0, 4, height); // Start handle line
        ctx.fillRect(trimEndX - 2, 0, 4, height); // End handle line
        
        ctx.beginPath();
        ctx.arc(trimStartX, height / 2, 8, 0, 2 * Math.PI); // Start handle circle
        ctx.arc(trimEndX, height / 2, 8, 0, 2 * Math.PI); // End handle circle
        ctx.fill();
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (videoRef.current) {
            const playheadX = (videoRef.current.currentTime / duration) * width;
            ctx.fillStyle = '#facc15';
            ctx.fillRect(playheadX - 1, 0, 2, height);
        }

    }, [duration, trimStart, trimEnd, getAllCuts]); // Added getAllCuts to dependencies

    const fetchAndProcessData = useCallback(async () => {
        if (!ffmpeg) return;
        setIsLoading(true);
        try {
            // Use the updated getGoogleGenAIInstance for API calls
            const transcriptData = await getTranscriptWithTimestampsAndFillers(take.blob);
            setTimedTranscript(transcriptData);

            const fillerCuts: Cut[] = transcriptData.words
                .filter(w => w.isFiller)
                .map(w => ({ id: `filler-${w.start}`, start: w.start, end: w.end, type: 'filler', text: w.word }));

            const silenceCuts: Cut[] = transcriptData.silences
                .map(s => ({ id: `silence-${s.start}`, start: s.start, end: s.end, type: 'silence', text: `Silence (${s.duration.toFixed(1)}s)` }));

            setCuts([...fillerCuts, ...silenceCuts]);

            ffmpeg.on('log', ({ message }: { message: string }) => console.log(message));
            ffmpeg.on('progress', ({ progress }: { progress: number }) => {
                if (isSaving) { // Only update progress for save operations
                    setSaveProgress(Math.round(progress * 100));
                }
            });
            
            const response = await fetch(take.url);
            const arrayBuffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            await ffmpeg.writeFile('input.webm', uint8Array);

            await ffmpeg.exec(['-i', 'input.webm', '-vn', '-acodec', 'pcm_s16le', '-f', 'wav', 'output.wav']);
            const data = await ffmpeg.readFile('output.wav') as Uint8Array;
            
            const audioContext = new AudioContext();
            audioBufferRef.current = await audioContext.decodeAudioData(data.buffer);
            await ffmpeg.deleteFile('output.wav');


        } catch (e: any) {
            console.error("Error processing video data:", e);
            onError(`Failed to analyze video: ${e.message || 'Unknown error'}. Please ensure your API Key is valid.`);
        } finally {
            setIsLoading(false);
        }
    }, [take.blob, take.url, ffmpeg, isSaving, getGoogleGenAIInstance, onError]); // Added onError dependency

    useEffect(() => {
        fetchAndProcessData();
        const video = videoRef.current;
        
        const handleMetadata = () => {
            if (video) {
                const videoDuration = video.duration;
                if (videoDuration && isFinite(videoDuration)) {
                    setDuration(videoDuration);
                    setTrimEnd(videoDuration);
                }
            }
        };

        if (video) {
            // If metadata is already loaded, handle it immediately.
            if (video.readyState >= 1) { // HAVE_METADATA
                handleMetadata();
            } else {
                // Otherwise, add an event listener.
                video.addEventListener('loadedmetadata', handleMetadata);
            }
        }

        // Cleanup the event listener.
        return () => {
            if (video) {
                video.removeEventListener('loadedmetadata', handleMetadata);
            }
        };
    }, [fetchAndProcessData]);
    
    useEffect(() => {
        const video = videoRef.current;
        
        const handleTimeUpdate = () => {
            if (!video) return;
            const currentTime = video.currentTime;
            
            // Auto-rewind/pause if outside trim or hitting a cut
            let targetTime = currentTime;
            if (currentTime < trimStart) {
                targetTime = trimStart;
            } else if (currentTime >= trimEnd) {
                video.pause();
                targetTime = trimEnd;
            } else {
                const allCuts = getAllCuts();
                for (const cut of allCuts) {
                    if (currentTime >= cut.start && currentTime < cut.end) {
                        targetTime = cut.end;
                        break;
                    }
                }
            }

            if (targetTime !== currentTime) {
                video.currentTime = targetTime;
            }

            drawWaveform();
        };

        if (video) {
            video.addEventListener('timeupdate', handleTimeUpdate);
            video.addEventListener('seeked', drawWaveform);
            video.addEventListener('play', drawWaveform);
            video.addEventListener('pause', drawWaveform);
        }
        
        drawWaveform();

        return () => {
            if (video) {
                video.removeEventListener('timeupdate', handleTimeUpdate);
                video.removeEventListener('seeked', drawWaveform);
                video.removeEventListener('play', drawWaveform);
                video.removeEventListener('pause', drawWaveform);
            }
        };
    }, [drawWaveform, trimStart, trimEnd, getAllCuts]); // Added getAllCuts to dependencies

    const handleWaveformMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = waveformRef.current;
        if (!canvas || !videoRef.current || duration === 0) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = (x / canvas.width) * duration;

        const trimStartX = (trimStart / duration) * canvas.width;
        const trimEndX = (trimEnd / duration) * canvas.width;

        // Check if dragging trim handles
        if (Math.abs(x - trimStartX) < 10) { // 10px tolerance for trimStart handle
            isDraggingTrimStart.current = true;
            videoRef.current.pause();
        } else if (Math.abs(x - trimEndX) < 10) { // 10px tolerance for trimEnd handle
            isDraggingTrimEnd.current = true;
            videoRef.current.pause();
        } else {
            // Otherwise, seek video
            videoRef.current.currentTime = time;
            // No need to call video.play() here; user might just be scrubbing.
            // The timeupdate listener will handle redrawing the playhead.
        }
    };

    const handleWaveformMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDraggingTrimStart.current && !isDraggingTrimEnd.current) return;

        const canvas = waveformRef.current;
        if (!canvas || duration === 0) return;
        const rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        x = Math.max(0, Math.min(x, canvas.width)); // Clamp x within canvas bounds
        let newTime = (x / canvas.width) * duration;

        if (isDraggingTrimStart.current) {
            newTime = Math.min(newTime, trimEnd - 0.1); // Ensure start < end
            setTrimStart(newTime);
        } else if (isDraggingTrimEnd.current) {
            newTime = Math.max(newTime, trimStart + 0.1); // Ensure end > start
            setTrimEnd(newTime);
        }
        drawWaveform(); // Redraw during drag
    };

    const handleWaveformMouseUp = () => {
        isDraggingTrimStart.current = false;
        isDraggingTrimEnd.current = false;
        // Optional: snap video to new trim points if it was paused
        if (videoRef.current) {
            if (videoRef.current.currentTime < trimStart) videoRef.current.currentTime = trimStart;
            if (videoRef.current.currentTime > trimEnd) videoRef.current.currentTime = trimEnd;
        }
    };
    
    const handleAddManualCut = () => {
        const start = parseFloat(manualCutStart);
        const end = parseFloat(manualCutEnd);
        if (!isNaN(start) && !isNaN(end) && end > start && end <= duration) {
            setManualCuts([...manualCuts, { id: `manual-${Date.now()}`, start, end, type: 'manual' }]);
            setManualCutStart('');
            setManualCutEnd('');
        } else {
            alert("Invalid manual cut times. Ensure start is less than end and within video duration.");
        }
    };
    
    const handleSave = async (saveToLibrary: boolean = false) => {
        if (!ffmpeg) {
            console.error("FFmpeg not ready.");
            onError("Video editor is not fully loaded. Please wait.");
            return;
        }

        setIsSaving(true);
        setSaveProgress(0);

        try {
            // Re-read file to be safe if FFmpeg state is ever modified elsewhere
            const response = await fetch(take.url);
            const arrayBuffer = await response.arrayBuffer();
            await ffmpeg.writeFile('input.webm', new Uint8Array(arrayBuffer));

            const allCuts = getAllCuts();
            const segmentsToKeep = [];
            let lastEnd = trimStart;

            for (const cut of allCuts) {
                if (cut.start > lastEnd) {
                    segmentsToKeep.push({ start: lastEnd, end: cut.start });
                }
                lastEnd = Math.max(lastEnd, cut.end);
            }

            if (trimEnd > lastEnd) {
                segmentsToKeep.push({ start: lastEnd, end: trimEnd });
            }
            
            if (segmentsToKeep.length === 0 && (trimStart >= trimEnd)) {
                console.warn("No video segments left after cutting. Aborting.");
                onFinishEditing(new Blob([], { type: exportFormat === 'mp4' ? 'video/mp4' : 'image/gif' }));
                setIsSaving(false);
                return;
            }
            
            const ffmpegArgs = ['-i', 'input.webm'];
            // Create complex filter for concatenation if multiple segments, or select if one segment
            let filterComplex = '';
            let mapArgs: string[] = [];

            if (segmentsToKeep.length === 1) {
                const s = segmentsToKeep[0];
                ffmpegArgs.push('-ss', s.start.toString(), '-to', s.end.toString());
            } else {
                segmentsToKeep.forEach((s, i) => {
                    ffmpegArgs.push('-ss', s.start.toString(), '-to', s.end.toString(), '-i', 'input.webm');
                    filterComplex += `[${i + 1}:v][${i + 1}:a]`;
                });
                filterComplex += `concat=n=${segmentsToKeep.length}:v=1:a=1[outv][outa]`;
                ffmpegArgs.push('-filter_complex', filterComplex);
            }


            if (exportFormat === 'mp4') {
                const [width, height] = resolution === '1080p' ? ['1920', '1080'] : ['1280', '720'];
                
                let videoFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,fps=${frameRate}`;
                let audioFilter = `aresample=async=1:cl=1`; // Ensure audio sync

                if (segmentsToKeep.length === 1) {
                    ffmpegArgs.push('-vf', videoFilter, '-af', audioFilter);
                } else {
                    filterComplex += `;[outv]${videoFilter}[finalv];[outa]${audioFilter}[finala]`;
                    ffmpegArgs[ffmpegArgs.indexOf('-filter_complex')] = '-filter_complex'; // Replace to use the extended filter
                    ffmpegArgs[ffmpegArgs.findIndex(arg => arg.startsWith('concat='))] = filterComplex; // Replace with full filter
                    mapArgs = ['-map', '[finalv]', '-map', '[finala]']; // Map to final filtered streams
                }

                ffmpegArgs.push(...mapArgs, '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-movflags', 'faststart', '-f', 'mp4', 'output.mp4');

                await ffmpeg.exec(...ffmpegArgs);
                const data = await ffmpeg.readFile('output.mp4') as Uint8Array;
                const finalBlob = new Blob([data.buffer], { type: 'video/mp4' });

                if (saveToLibrary && editingFromLibrary) {
                    await saveEditedVideoToLibrary(finalBlob);
                }

                onFinishEditing(finalBlob);

            } else { // GIF
                 const width = resolution === '720p' ? '480' : '320';
                 let gifFilter = `scale=${width}:-1,fps=${frameRate}`;
                 if (segmentsToKeep.length === 1) {
                     // No need for select='...' here as -ss and -to already define the segment
                     gifFilter = `${gifFilter},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`;
                     ffmpegArgs.push('-filter_complex', gifFilter);
                 } else {
                    filterComplex += `;[outv]${gifFilter},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`;
                    ffmpegArgs[ffmpegArgs.indexOf('-filter_complex')] = '-filter_complex';
                    ffmpegArgs[ffmpegArgs.findIndex(arg => arg.startsWith('concat='))] = filterComplex;
                    mapArgs = []; // No audio, map only video
                 }
                ffmpegArgs.push(...mapArgs, '-f', 'gif', 'output.gif');
                 await ffmpeg.exec(...ffmpegArgs);
                 const data = await ffmpeg.readFile('output.gif') as Uint8Array;
                 const finalBlob = new Blob([data.buffer], { type: 'image/gif' });

                 if (saveToLibrary && editingFromLibrary) {
                     await saveEditedVideoToLibrary(finalBlob);
                 }

                 onFinishEditing(finalBlob);
            }

        } catch (e: any) {
            console.error("Error saving video:", e);
            onError(`Failed to save video: ${e.message || 'Unknown error'}.`);
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) return <div className="text-center p-8" role="status" aria-live="polite">Analyzing video...</div>;

    return (
        <div className="bg-gray-800 p-6 rounded-lg space-y-4 max-w-7xl mx-auto w-full">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <video ref={videoRef} src={take.url} controls className="w-full rounded-lg bg-black aspect-video" aria-label="Video preview for editing" />
                    <div className="relative">
                        <canvas 
                            ref={waveformRef} 
                            width="1000" 
                            height="100" 
                            className="w-full h-24 bg-gray-900 rounded cursor-pointer" 
                            onMouseDown={handleWaveformMouseDown}
                            onMouseMove={handleWaveformMouseMove}
                            onMouseUp={handleWaveformMouseUp}
                            onMouseLeave={handleWaveformMouseUp} // End drag if mouse leaves canvas
                            aria-label="Video waveform timeline for trimming and cutting" 
                            role="slider" 
                            aria-valuemin={0} 
                            aria-valuemax={duration} 
                            aria-valuenow={videoRef.current?.currentTime || 0}
                        />
                         <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none">
                            <span className="absolute top-1 left-1 text-xs text-gray-400">{formatTime(trimStart)}</span>
                            <span className="absolute top-1 right-1 text-xs text-gray-400">{formatTime(trimEnd)}</span>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div>
                        <h3 className="font-semibold text-lg" id="ai-cuts-heading">AI Suggested Cuts</h3>
                        <div className="space-y-2 mt-2" role="group" aria-labelledby="ai-cuts-heading">
                            {[...cuts].sort((a,b) => a.start - b.start).map(cut => (
                                <div key={cut.id} className="bg-gray-700 p-2 rounded flex items-center gap-3" role="listitem">
                                    <input 
                                        type="checkbox" 
                                        defaultChecked 
                                        id={`cut-${cut.id}`} 
                                        className="form-checkbox h-5 w-5 bg-gray-800 border-gray-600 rounded text-yellow-500 focus:ring-yellow-500"
                                        aria-label={`Toggle ${cut.type} cut from ${formatTime(cut.start)} to ${formatTime(cut.end)}`}
                                    />
                                    <div className="flex-grow">
                                        <p className="font-mono text-sm">{formatTime(cut.start)} - {formatTime(cut.end)}</p>
                                        <p className="text-xs text-gray-400 capitalize flex items-center gap-1.5">
                                            {cut.type === 'filler' ? <ScissorsIcon className="w-3 h-3 text-red-400"/> : <MuteIcon className="w-3 h-3 text-blue-400"/>}
                                            {cut.text}
                                        </p>
                                    </div>
                                    <button onClick={() => { if(videoRef.current) videoRef.current.currentTime = cut.start }} className="p-1 rounded hover:bg-gray-600" aria-label={`Play from start of ${cut.type} cut`}><PlayIcon className="w-6 h-6 hover:text-yellow-400"/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg" id="manual-cuts-heading">Manual Cuts</h3>
                        <div className="mt-2 space-y-2" role="group" aria-labelledby="manual-cuts-heading">
                            <div className="flex gap-2">
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    value={manualCutStart} 
                                    onChange={e => setManualCutStart(e.target.value)} 
                                    placeholder="Start (s)" 
                                    className="bg-gray-700 p-2 rounded w-1/2" 
                                    aria-label="Manual cut start time in seconds"
                                />
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    value={manualCutEnd} 
                                    onChange={e => setManualCutEnd(e.target.value)} 
                                    placeholder="End (s)" 
                                    className="bg-gray-700 p-2 rounded w-1/2" 
                                    aria-label="Manual cut end time in seconds"
                                />
                            </div>
                            <button onClick={handleAddManualCut} className="w-full p-2 bg-gray-700 rounded hover:bg-gray-600" aria-label="Add manual cut">Add Manual Cut</button>
                            <div className="space-y-2">
                                {manualCuts.map(cut => (
                                    <div key={cut.id} className="bg-gray-700 p-2 rounded flex items-center gap-3" role="listitem">
                                        <input 
                                            type="checkbox" 
                                            defaultChecked 
                                            id={`cut-${cut.id}`} 
                                            className="form-checkbox h-5 w-5 bg-gray-800 border-gray-600 rounded text-yellow-500 focus:ring-yellow-500"
                                            aria-label={`Toggle manual cut from ${formatTime(cut.start)} to ${formatTime(cut.end)}`}
                                        />
                                        <div className="flex-grow">
                                            <p className="font-mono text-sm">{formatTime(cut.start)} - {formatTime(cut.end)}</p>
                                            <p className="text-xs text-gray-400 capitalize flex items-center gap-1.5">
                                                <ScissorsIcon className="w-3 h-3 text-red-400"/>
                                                Manual Cut
                                            </p>
                                        </div>
                                        <button onClick={() => { if(videoRef.current) videoRef.current.currentTime = cut.start }} className="p-1 rounded hover:bg-gray-600" aria-label={`Play from start of manual cut`}><PlayIcon className="w-6 h-6 hover:text-yellow-400"/></button>
                                        <button onClick={() => setManualCuts(manualCuts.filter(c => c.id !== cut.id))} className="p-1 rounded text-gray-400 hover:text-red-400" aria-label="Remove manual cut"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg" id="export-settings-heading">Export Settings</h3>
                        <div className="grid grid-cols-3 gap-2 mt-2" role="group" aria-labelledby="export-settings-heading">
                            <select value={exportFormat} onChange={e => setExportFormat(e.target.value as any)} className="bg-gray-700 p-2 rounded" aria-label="Export format">
                                <option value="mp4">MP4 Video</option>
                                <option value="gif">Animated GIF</option>
                            </select>
                            <select value={resolution} onChange={e => setResolution(e.target.value)} className="bg-gray-700 p-2 rounded" aria-label="Video resolution">
                                <option value="720p">720p</option>
                                <option value="1080p">1080p</option>
                            </select>
                             <select value={frameRate} onChange={e => setFrameRate(e.target.value)} className="bg-gray-700 p-2 rounded" aria-label="Video frame rate">
                                <option value="24">24 FPS</option>
                                <option value="30">30 FPS</option>
                            </select>
                        </div>
                    </div>
                </div>
             </div>
             {isSaving && (
                 <div className="fixed inset-0 bg-black/70 flex flex-col items-center justify-center z-50" role="status" aria-live="polite" aria-label={`Processing video, ${saveProgress}% complete`}>
                    <div className="bg-gray-800 p-6 rounded-lg text-center w-64">
                        <p className="font-semibold">Processing video...</p>
                        <div className="w-full bg-gray-600 rounded-full h-2.5 mt-2">
                            <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${saveProgress}%` }}></div>
                        </div>
                        <p className="text-sm mt-1">{saveProgress}%</p>
                    </div>
                 </div>
             )}
             <div className="flex justify-end gap-4 pt-4 border-t border-gray-700" role="group" aria-label="Editor actions">
                <button onClick={onCancel} className="px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-500" aria-label="Go back to video recorder">Back</button>
                {editingFromLibrary && (
                    <button onClick={() => handleSave(true)} disabled={isSaving || !ffmpeg} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 disabled:opacity-50" aria-label={isSaving ? 'Processing video' : 'Save to library'}>
                        {isSaving ? 'Processing...' : 'Save to Library'}
                    </button>
                )}
                <button onClick={() => handleSave(false)} disabled={isSaving || !ffmpeg} className="px-6 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50" aria-label={isSaving ? 'Processing video' : 'Apply edits and export video'}>
                    {isSaving ? 'Processing...' : editingFromLibrary ? 'Apply Edits' : 'Apply Edits & Export'}
                </button>
                {onCreateCampaign && !editingFromLibrary && (
                    <button
                        onClick={async () => {
                            const blob = await handleSave(false);
                            if (blob && onCreateCampaign) {
                                onCreateCampaign(blob);
                            }
                        }}
                        disabled={isSaving || !ffmpeg}
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        aria-label="Create campaign with edited video"
                    >
                        🚀 Create Campaign
                    </button>
                )}
             </div>
        </div>
    );
};