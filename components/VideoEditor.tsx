import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Take } from './VideoRecorder';
import { getTranscriptWithTimestampsAndFillers, TimedTranscript, Word, Silence } from '../services/geminiService';
import { ClockIcon, ScissorsIcon, MuteIcon, PlayIcon } from './icons';

declare const window: any;

interface VideoEditorProps {
    take: Take;
    onFinishEditing: (editedBlob: Blob) => void;
    onCancel: () => void;
}

type Cut = { id: string; start: number; end: number; type: 'filler' | 'silence' | 'manual'; text?: string };

export const VideoEditor: React.FC<VideoEditorProps> = ({ take, onFinishEditing, onCancel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const waveformRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timedTranscript, setTimedTranscript] = useState<TimedTranscript | null>(null);
    const [cuts, setCuts] = useState<Cut[]>([]);
    const [manualCuts, setManualCuts] = useState<Cut[]>([]);
    
    // Trimming state
    const [duration, setDuration] = useState(0);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);

    // Manual cut state
    const [manualCutStart, setManualCutStart] = useState('');
    const [manualCutEnd, setManualCutEnd] = useState('');
    
    // Export state
    const [isSaving, setIsSaving] = useState(false);
    const [saveProgress, setSaveProgress] = useState(0);
    const [exportFormat, setExportFormat] = useState<'mp4' | 'gif'>('mp4');
    const [resolution, setResolution] = useState('720p');
    const [frameRate, setFrameRate] = useState('30');

    const audioBufferRef = useRef<AudioBuffer | null>(null);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds - Math.floor(seconds)) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    const fetchAndProcessData = useCallback(async () => {
        setIsLoading(true);
        try {
            const transcriptData = await getTranscriptWithTimestampsAndFillers(take.blob);
            setTimedTranscript(transcriptData);

            const fillerCuts: Cut[] = transcriptData.words
                .filter(w => w.isFiller)
                .map(w => ({ id: `filler-${w.start}`, start: w.start, end: w.end, type: 'filler', text: w.word }));

            const silenceCuts: Cut[] = transcriptData.silences
                .map(s => ({ id: `silence-${s.start}`, start: s.start, end: s.end, type: 'silence', text: `Silence (${s.duration.toFixed(1)}s)` }));

            setCuts([...fillerCuts, ...silenceCuts]);

            // Process audio for waveform
            const audioContext = new AudioContext();
            const response = await fetch(take.url);
            const arrayBuffer = await response.arrayBuffer();
            audioBufferRef.current = await audioContext.decodeAudioData(arrayBuffer);

        } catch (e) {
            console.error("Error processing video data:", e);
        } finally {
            setIsLoading(false);
        }
    }, [take.blob, take.url]);

    useEffect(() => {
        fetchAndProcessData();
        if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
                if (videoRef.current) {
                    const videoDuration = videoRef.current.duration;
                    setDuration(videoDuration);
                    setTrimEnd(videoDuration);
                }
            };
        }
    }, [fetchAndProcessData]);
    
    const drawWaveform = useCallback(() => {
        const canvas = waveformRef.current;
        if (!canvas || !audioBufferRef.current) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const data = audioBufferRef.current.getChannelData(0);
        const width = canvas.width;
        const height = canvas.height;
        const step = Math.ceil(data.length / width);
        const amp = height / 2;

        ctx.clearRect(0, 0, width, height);
        
        // Draw background
        ctx.fillStyle = '#1f2937'; // gray-800
        ctx.fillRect(0,0,width,height);

        // Draw waveform
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#6b7280'; // gray-500
        ctx.beginPath();
        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            ctx.moveTo(i, (1 + min) * amp);
            ctx.lineTo(i, (1 + max) * amp);
        }
        ctx.stroke();

        const allCuts = getAllCuts();
        // Draw cut highlights
        allCuts.forEach(cut => {
            const startX = (cut.start / duration) * width;
            const endX = (cut.end / duration) * width;
            ctx.fillStyle = cut.type === 'silence' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(239, 68, 68, 0.5)'; // blue-500 or red-500
            ctx.fillRect(startX, 0, endX - startX, height);
        });

        // Draw trim handles
        const trimStartX = (trimStart / duration) * width;
        const trimEndX = (trimEnd / duration) * width;
        ctx.fillStyle = 'rgba(250, 204, 21, 0.2)'; // yellow-400
        ctx.fillRect(0, 0, trimStartX, height);
        ctx.fillRect(trimEndX, 0, width - trimEndX, height);
        
        // Draw playhead
        if (videoRef.current) {
            const playheadX = (videoRef.current.currentTime / duration) * width;
            ctx.fillStyle = '#facc15';
            ctx.fillRect(playheadX, 0, 2, height);
        }

    }, [duration, trimStart, trimEnd, cuts, manualCuts]);

    useEffect(() => {
        const video = videoRef.current;
        const handleTimeUpdate = () => {
            if (!video) return;
            const currentTime = video.currentTime;
            
            // Enforce trims
            if (currentTime < trimStart) video.currentTime = trimStart;
            if (currentTime > trimEnd) {
                video.pause();
                video.currentTime = trimEnd;
            }

            // Skip cuts during preview
            const allCuts = getAllCuts();
            for (const cut of allCuts) {
                if (currentTime >= cut.start && currentTime < cut.end) {
                    video.currentTime = cut.end;
                }
            }
            drawWaveform();
        };

        if (video) {
            video.addEventListener('timeupdate', handleTimeUpdate);
            video.addEventListener('seeked', drawWaveform);
            video.addEventListener('play', drawWaveform);
        }
        
        drawWaveform(); // Initial draw

        return () => {
            if (video) {
                video.removeEventListener('timeupdate', handleTimeUpdate);
                video.removeEventListener('seeked', drawWaveform);
                video.removeEventListener('play', drawWaveform);
            }
        };
    }, [drawWaveform, trimStart, trimEnd, cuts, manualCuts]);

    const handleWaveformClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = waveformRef.current;
        if (!canvas || !videoRef.current) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = (x / canvas.width) * duration;
        videoRef.current.currentTime = time;
    };
    
    const getAllCuts = useCallback(() => {
        return [...cuts, ...manualCuts]
            .sort((a, b) => a.start - b.start)
            .filter(cut => {
                const toggle = document.getElementById(`cut-${cut.id}`) as HTMLInputElement;
                return toggle ? toggle.checked : true;
            });
    }, [cuts, manualCuts]);


    const handleAddManualCut = () => {
        const start = parseFloat(manualCutStart);
        const end = parseFloat(manualCutEnd);
        if (!isNaN(start) && !isNaN(end) && end > start && end <= duration) {
            setManualCuts([...manualCuts, { id: `manual-${Date.now()}`, start, end, type: 'manual' }]);
            setManualCutStart('');
            setManualCutEnd('');
        }
    };
    
    const handleSave = async () => {
        setIsSaving(true);
        setSaveProgress(0);

        try {
            const { FFmpeg } = window.FFmpeg;
            const ffmpeg = new FFmpeg();
            ffmpeg.on('log', ({ message }) => console.log(message));
            ffmpeg.on('progress', ({ progress }) => setSaveProgress(Math.round(progress * 100)));
            
            await ffmpeg.load();

            const response = await fetch(take.url);
            const arrayBuffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            await ffmpeg.writeFile('input.webm', uint8Array);

            const allCuts = getAllCuts();
            let filterComplex = '';
            let lastSegment = `[0:v]trim=start=${trimStart}:end=${allCuts.length > 0 ? allCuts[0].start : trimEnd},setpts=PTS-STARTPTS[v0];`;
            lastSegment += `[0:a]atrim=start=${trimStart}:end=${allCuts.length > 0 ? allCuts[0].start : trimEnd},asetpts=PTS-STARTPTS[a0];`;
            
            for (let i = 0; i < allCuts.length; i++) {
                const cut = allCuts[i];
                const nextCutStart = (i + 1 < allCuts.length) ? allCuts[i + 1].start : trimEnd;
                if (cut.end < nextCutStart) {
                    filterComplex += `[0:v]trim=start=${cut.end}:end=${nextCutStart},setpts=PTS-STARTPTS[v${i + 1}];`;
                    filterComplex += `[0:a]atrim=start=${cut.end}:end=${nextCutStart},asetpts=PTS-STARTPTS[a${i + 1}];`;
                }
            }

            const concatInputsV = Array.from({ length: allCuts.length + 1 }, (_, i) => `[v${i}]`).join('');
            const concatInputsA = Array.from({ length: allCuts.length + 1 }, (_, i) => `[a${i}]`).join('');
            filterComplex += `${concatInputsV}concat=n=${allCuts.length + 1}:v=1[outv];`;
            filterComplex += `${concatInputsA}concat=n=${allCuts.length + 1}:a=1[outa];`;
            
            const ffmpegArgs = ['-i', 'input.webm'];

            if (exportFormat === 'mp4') {
                const [width, height] = resolution === '1080p' ? ['1920', '1080'] : ['1280', '720'];
                const scaleFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;
                
                ffmpegArgs.push(
                    '-filter_complex', `${lastSegment}${filterComplex}${scaleFilter},fps=${frameRate}`,
                    '-map', '[outv]', '-map', '[outa]',
                    'output.mp4'
                );
                await ffmpeg.exec(...ffmpegArgs);
                const data = await ffmpeg.readFile('output.mp4') as Uint8Array;
                onFinishEditing(new Blob([data.buffer], { type: 'video/mp4' }));
            } else { // GIF
                 const [width, height] = resolution === '1080p' ? ['1080', '1080'] : ['720', '720']; // GIFs are often square-ish
                 const scaleFilter = `scale=${width}:-1,fps=${frameRate},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`;
                
                 ffmpegArgs.push(
                    '-filter_complex', `${lastSegment}${filterComplex}${scaleFilter}`,
                    '-map', '[outv]',
                    'output.gif'
                 );
                 await ffmpeg.exec(...ffmpegArgs);
                 const data = await ffmpeg.readFile('output.gif') as Uint8Array;
                 onFinishEditing(new Blob([data.buffer], { type: 'image/gif' }));
            }

        } catch (e) {
            console.error("Error saving video:", e);
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) return <div className="text-center p-8">Analyzing video...</div>;

    return (
        <div className="bg-gray-800 p-6 rounded-lg space-y-4 max-w-7xl mx-auto w-full">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Panel: Player & Timeline */}
                <div className="space-y-4">
                    <video ref={videoRef} src={take.url} controls className="w-full rounded-lg bg-black" />
                    <canvas ref={waveformRef} width="1000" height="100" className="w-full h-24 bg-gray-900 rounded cursor-pointer" onClick={handleWaveformClick} />
                    {/* Trim controls would overlay or be near the waveform */}
                </div>
                
                {/* Right Panel: Edits & Export */}
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {/* Suggested Cuts */}
                    <div>
                        <h3 className="font-semibold text-lg">AI Suggested Cuts</h3>
                        <div className="space-y-2 mt-2">
                            {[...cuts].sort((a,b) => a.start - b.start).map(cut => (
                                <div key={cut.id} className="bg-gray-700 p-2 rounded flex items-center gap-3">
                                    <input type="checkbox" defaultChecked id={`cut-${cut.id}`} className="form-checkbox h-5 w-5 bg-gray-800 border-gray-600 rounded text-yellow-500 focus:ring-yellow-500"/>
                                    <div className="flex-grow">
                                        <p className="font-mono text-sm">{formatTime(cut.start)} - {formatTime(cut.end)}</p>
                                        <p className="text-xs text-gray-400 capitalize flex items-center gap-1.5">
                                            {cut.type === 'filler' ? <ScissorsIcon className="w-3 h-3 text-red-400"/> : <MuteIcon className="w-3 h-3 text-blue-400"/>}
                                            {cut.text}
                                        </p>
                                    </div>
                                    <button onClick={() => videoRef.current!.currentTime = cut.start - 1}><PlayIcon className="w-6 h-6 hover:text-yellow-400"/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                     {/* Manual Cuts */}
                    <div>
                        <h3 className="font-semibold text-lg">Manual Cuts</h3>
                         {/* ... manual cuts UI ... */}
                    </div>
                     {/* Export Settings */}
                    <div>
                        <h3 className="font-semibold text-lg">Export Settings</h3>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            <select value={exportFormat} onChange={e => setExportFormat(e.target.value as any)} className="bg-gray-700 p-2 rounded">
                                <option value="mp4">MP4 Video</option>
                                <option value="gif">Animated GIF</option>
                            </select>
                            <select value={resolution} onChange={e => setResolution(e.target.value)} className="bg-gray-700 p-2 rounded">
                                <option value="720p">720p</option>
                                <option value="1080p">1080p</option>
                            </select>
                             <select value={frameRate} onChange={e => setFrameRate(e.target.value)} className="bg-gray-700 p-2 rounded">
                                <option value="24">24 FPS</option>
                                <option value="30">30 FPS</option>
                            </select>
                        </div>
                    </div>
                </div>
             </div>
             {isSaving && (
                 <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg text-center">
                        <p className="font-semibold">Processing video...</p>
                        <progress value={saveProgress} max="100" className="w-full mt-2"></progress>
                        <p className="text-sm mt-1">{saveProgress}%</p>
                    </div>
                 </div>
             )}
             <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                <button onClick={onCancel} className="px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-500">Back</button>
                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50">
                    {isSaving ? 'Processing...' : 'Apply Edits & Export'}
                </button>
             </div>
        </div>
    );
};
