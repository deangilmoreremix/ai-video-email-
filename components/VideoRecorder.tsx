

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { generateTranscriptFromVideo, analyzeTranscriptForQuality, getKeywordsFromScript } from '../services/geminiService';
import {
    RecordIcon, StopIcon, TrashIcon, SparklesIcon, DropletIcon, ImageIcon, ScrollIcon,
    FaceSmileIcon, HandIcon, CaptionsIcon, PartyHatIcon, SmoothIcon
} from './icons';

// MediaPipe types might not be globally available, so we declare them.
declare const window: any;

export interface Take {
    id: string;
    blob: Blob;
    url: string;
    transcript: string | null;
    analysis: { score: number; justification: string } | null;
    status: 'recording' | 'transcribing' | 'analyzing' | 'complete' | 'failed';
}

interface VideoRecorderProps {
    script: string;
    takes: Take[];
    setTakes: React.Dispatch<React.SetStateAction<Take[]>>;
    onSelectTake: (take: Take) => void;
    onEditTake: (take: Take) => void;
    selectedTakeId?: string;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({ script, takes, setTakes, onSelectTake, onEditTake, selectedTakeId }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    
    // AI Camera state
    const [effects, setEffects] = useState({ segmenter: null, faceMesh: null, handLandmarker: null });
    const [isLoadingEffects, setIsLoadingEffects] = useState(true);
    const [isEffectsPanelOpen, setIsEffectsPanelOpen] = useState(false);
    const [isArPanelOpen, setIsArPanelOpen] = useState(false);
    
    // Effect settings
    const [backgroundEffect, setBackgroundEffect] = useState<'none' | 'blur' | 'image'>('none');
    const [virtualBgImage, setVirtualBgImage] = useState<HTMLImageElement | null>(null);
    const [arEffect, setArEffect] = useState<'none' | 'glasses' | 'hat' | 'nose' | 'smoothing'>('none');
    const [isGestureControlEnabled, setIsGestureControlEnabled] = useState(false);
    const [isCaptionsEnabled, setIsCaptionsEnabled] = useState(false);
    const [liveCaption, setLiveCaption] = useState('');

    // Teleprompter State
    const [isTeleprompterVisible, setIsTeleprompterVisible] = useState(false);
    const [teleprompterSpeed, setTeleprompterSpeed] = useState(1);
    const [teleprompterFontSize, setTeleprompterFontSize] = useState(24);
    const [teleprompterFont, setTeleprompterFont] = useState('Arial');
    const [teleprompterTextColor, setTeleprompterTextColor] = useState('#FFFFFF');
    const [teleprompterBgColor, setTeleprompterBgColor] = useState('rgba(0, 0, 0, 0.5)');
    const [isAiPacing, setIsAiPacing] = useState(false);
    const [highlightedKeywords, setHighlightedKeywords] = useState<string[]>([]);
    const [isHighlighting, setIsHighlighting] = useState(false);

    const teleprompterScrollRef = useRef(0);
    const precomputedLinesRef = useRef<string[]>([]);
    const currentWordIndexRef = useRef(0);

    const speechRecognitionRef = useRef<any>(null);
    
    const recommendedTakeId = useMemo(() => {
        const completedTakes = takes.filter(t => t.analysis);
        if (completedTakes.length === 0) return null;
        return completedTakes.reduce((best, current) =>
            current.analysis!.score > best.analysis!.score ? current : best
        ).id;
    }, [takes]);

    const initEffects = useCallback(async () => {
        // FIX: Use the correct global object `MediaPipeTasks` provided by the CDN script.
        if (!window.MediaPipeTasks) {
            console.error("MediaPipe Tasks library not available.");
            setIsLoadingEffects(false);
            return;
        }
        try {
            const vision = await window.MediaPipeTasks.vision.FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
            );
            const segmenter = await window.MediaPipeTasks.vision.ImageSegmenter.createFromOptions(vision, {
                baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float16/1/selfie_multiclass_256x256.tflite` },
                runningMode: 'VIDEO',
                outputCategoryMask: true,
            });
            const faceMesh = await window.MediaPipeTasks.vision.FaceLandmarker.createFromOptions(vision, {
                baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.tflite` },
                runningMode: 'VIDEO',
            });
            const handLandmarker = await window.MediaPipeTasks.vision.HandLandmarker.createFromOptions(vision, {
                baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.tflite`, delegate: "GPU" },
                runningMode: 'VIDEO',
                numHands: 1,
            });
            setEffects({ segmenter, faceMesh, handLandmarker });
        } catch (error) {
            console.error("Failed to initialize MediaPipe effects:", error);
        } finally {
            setIsLoadingEffects(false);
        }
    }, []);

    useEffect(() => {
        initEffects();
        return () => {
            if (effects.segmenter) (effects.segmenter as any).close();
            if (effects.faceMesh) (effects.faceMesh as any).close();
            if (effects.handLandmarker) (effects.handLandmarker as any).close();
        };
    }, [initEffects]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onloadedmetadata = () => {
                    if (videoRef.current) videoRef.current.play();
                    startProcessing();
                };
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        setStream(null);
    };
    
    const startProcessing = () => {
        if (!videoRef.current || !canvasRef.current || !effects.segmenter) {
            // Wait for effects to load
             if (isLoadingEffects) {
                setTimeout(startProcessing, 100);
            }
            return;
        }
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        let lastTime = -1;
        
        const processFrame = async (now: number) => {
            if (video.paused || video.ended) {
                animationFrameRef.current = requestAnimationFrame(processFrame);
                return;
            }
             if(lastTime < 0) lastTime = now;
            let elapsed = (now - lastTime);

            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            

            const startTimeMs = performance.now();
            
            // Background Effects
            if (backgroundEffect !== 'none' && effects.segmenter) {
                 (effects.segmenter as any).segmentForVideo(video, startTimeMs, (result: any) => {
                    ctx.save();
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    if (backgroundEffect === 'blur') {
                        ctx.filter = 'blur(10px)';
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        ctx.filter = 'none';
                    } else if (backgroundEffect === 'image' && virtualBgImage) {
                        ctx.drawImage(virtualBgImage, 0, 0, canvas.width, canvas.height);
                    }
                    ctx.globalCompositeOperation = 'destination-out';
                    ctx.drawImage(result.categoryMask, 0, 0, canvas.width, canvas.height);
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    ctx.restore();
                });
            } else {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }
            
            // AR Effects & Gesture Control
            if (arEffect !== 'none' && effects.faceMesh) {
                const faceLandmarkerResult = (effects.faceMesh as any).detectForVideo(video, startTimeMs);
                if (faceLandmarkerResult.faceLandmarks) {
                    faceLandmarkerResult.faceLandmarks.forEach((landmarks: any) => {
                       drawArEffects(ctx, landmarks);
                    });
                }
            }
            
            if (isGestureControlEnabled && effects.handLandmarker) {
                const handLandmarkerResult = (effects.handLandmarker as any).detectForVideo(video, startTimeMs);
                 if (handLandmarkerResult.landmarks && handLandmarkerResult.landmarks.length > 0) {
                     detectGesture(handLandmarkerResult.landmarks[0]);
                 }
            }

            // Teleprompter
            if (isTeleprompterVisible && precomputedLinesRef.current.length > 0) {
                 drawTeleprompter(ctx);
            }

            // Live Captions
            if (isCaptionsEnabled && liveCaption) {
                drawLiveCaptions(ctx);
            }
            
            ctx.restore();
            animationFrameRef.current = requestAnimationFrame(processFrame);
        };
        animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    const drawTeleprompter = (ctx: CanvasRenderingContext2D) => {
        // ... drawing logic for teleprompter, including vertical fade and reading zone ...
        const readingZoneY = ctx.canvas.height / 2;
        const fadeDistance = ctx.canvas.height / 4;

        ctx.save();
        ctx.fillStyle = teleprompterBgColor;
        ctx.fillRect(50, 0, ctx.canvas.width - 100, ctx.canvas.height);

        ctx.fillStyle = '#facc15'; // Yellow
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('>', 70, readingZoneY + 8);
        ctx.fillText('<', ctx.canvas.width - 70, readingZoneY + 8);
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${teleprompterFontSize}px ${teleprompterFont}`;
        
        const lines = precomputedLinesRef.current;
        const lineHeight = teleprompterFontSize * 1.2;
        
        lines.forEach((line, i) => {
            const lineY = (i * lineHeight) - teleprompterScrollRef.current + readingZoneY;
            
            // Calculate opacity for fade effect
            const distanceFromCenter = Math.abs(lineY - readingZoneY);
            let opacity = 1 - (distanceFromCenter / fadeDistance);
            opacity = Math.max(0, Math.min(1, opacity));
            
            ctx.fillStyle = teleprompterTextColor.replace(')', `, ${opacity})`).replace('rgb', 'rgba');

            const isCurrent = isAiPacing && i === currentWordIndexRef.current;

            // Highlight keywords
            const words = line.split(' ');
            let currentX = (ctx.canvas.width / 2) - (ctx.measureText(line).width / 2);
            ctx.textAlign = 'left';

            words.forEach(word => {
                const isKeyword = highlightedKeywords.some(kw => word.toLowerCase().includes(kw.toLowerCase()));
                if(isKeyword) {
                    ctx.save();
                    ctx.fillStyle = `rgba(250, 204, 21, ${opacity})`; // yellow-400
                    ctx.fillText(word + ' ', currentX, lineY);
                    ctx.restore();
                } else {
                     ctx.fillText(word + ' ', currentX, lineY);
                }
                currentX += ctx.measureText(word + ' ').width;
            });
        });

        ctx.restore();
    };

    const drawLiveCaptions = (ctx: CanvasRenderingContext2D) => {
        ctx.save();
        const text = liveCaption;
        ctx.font = '24px Arial';
        const textMetrics = ctx.measureText(text);
        const padding = 10;
        const boxHeight = 44;
        const boxWidth = textMetrics.width + padding * 2;
        const boxX = (ctx.canvas.width - boxWidth) / 2;
        const boxY = ctx.canvas.height - boxHeight - 20;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, ctx.canvas.width / 2, boxY + boxHeight / 2);
        ctx.restore();
    };

    const drawArEffects = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        
        if (arEffect === 'glasses') {
            const leftEye = landmarks[33];
            const rightEye = landmarks[263];
            const noseBridge = landmarks[168];
            if(!leftEye || !rightEye || !noseBridge) return;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(leftEye.x * w, leftEye.y * h);
            ctx.lineTo(rightEye.x * w, rightEye.y * h);
            ctx.stroke();
        } else if (arEffect === 'hat') {
             const forehead = landmarks[10];
             if(!forehead) return;
             ctx.fillStyle = 'purple';
             ctx.beginPath();
             ctx.moveTo(forehead.x * w - 50, forehead.y * h);
             ctx.lineTo(forehead.x * w + 50, forehead.y * h);
             ctx.lineTo(forehead.x * w, forehead.y * h - 100);
             ctx.closePath();
             ctx.fill();
        } else if (arEffect === 'nose') {
            const noseTip = landmarks[1];
            if (!noseTip) return;
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(noseTip.x * w, noseTip.y * h, 10, 0, 2 * Math.PI);
            ctx.fill();
        } else if (arEffect === 'smoothing') {
            ctx.save();
            ctx.filter = 'blur(5px)';
            ctx.beginPath();
            // This is a simplified mask, a real one would use all face points
            landmarks.forEach((point: any, index: number) => {
                const x = point.x * w;
                const y = point.y * h;
                if (index === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(ctx.canvas, 0, 0); // Redraw the clipped part blurred
            ctx.restore();
        }
    };
    
    // FIX: Moved startRecording and stopRecording before detectGesture to resolve 'used before declaration' error.
    const startRecording = useCallback(() => {
        if (!stream || !canvasRef.current || isRecording) return;
        
        const canvasStream = (canvasRef.current as any).captureStream(30);
        const audioTrack = stream.getAudioTracks()[0];
        canvasStream.addTrack(audioTrack);
        
        mediaRecorderRef.current = new MediaRecorder(canvasStream, { mimeType: 'video/webm; codecs=vp9' });
        recordedChunksRef.current = [];
        
        const newTakeId = `take_${Date.now()}`;
        setTakes(prev => [...prev, { id: newTakeId, blob: new Blob(), url: '', transcript: null, analysis: null, status: 'recording' }]);

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
            }
        };

        mediaRecorderRef.current.onstop = async () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            
            // Update the take with blob and url, and start processing
            setTakes(prev => prev.map(t => t.id === newTakeId ? { ...t, blob, url, status: 'transcribing' } : t));
            
            try {
                const transcript = await generateTranscriptFromVideo(blob);
                setTakes(prev => prev.map(t => t.id === newTakeId ? { ...t, transcript, status: 'analyzing' } : t));
                
                const analysis = await analyzeTranscriptForQuality(transcript);
                setTakes(prev => prev.map(t => t.id === newTakeId ? { ...t, analysis, status: 'complete' } : t));

            } catch (error) {
                console.error("Failed to process take:", error);
                 setTakes(prev => prev.map(t => t.id === newTakeId ? { ...t, status: 'failed' } : t));
            }
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        teleprompterScrollRef.current = 0; // Reset teleprompter on record
        if (isCaptionsEnabled) speechRecognitionRef.current?.start();
    }, [stream, isRecording, setTakes, isCaptionsEnabled]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (isCaptionsEnabled) speechRecognitionRef.current?.stop();
        }
    }, [isRecording, isCaptionsEnabled]);

    const detectGesture = useCallback((landmarks: any[]) => {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const wrist = landmarks[0];

        // Thumbs up
        if (thumbTip.y < indexTip.y && thumbTip.y < wrist.y) {
            if (!isRecording) startRecording();
        }
        // Fist (simplified)
        else if (thumbTip.y > indexTip.y && thumbTip.y > wrist.y) {
            if (isRecording) stopRecording();
        }
    }, [isRecording, startRecording, stopRecording]);

    // Handle background image upload
    const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    setVirtualBgImage(img);
                    setBackgroundEffect('image');
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    // Handle Teleprompter
    useEffect(() => {
        // Pre-compute lines for performance
        if (!canvasRef.current || !script) {
            precomputedLinesRef.current = [];
            return;
        }
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        
        ctx.font = `${teleprompterFontSize}px ${teleprompterFont}`;
        const maxWidth = ctx.canvas.width - 140; // With padding
        const words = script.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine !== '') {
                lines.push(currentLine.trim());
                currentLine = word + ' ';
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine.trim());
        precomputedLinesRef.current = lines;

    }, [script, teleprompterFontSize, teleprompterFont]);

    // Initialize Speech Recognition for captions & AI pacing
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) {
            console.error("Speech recognition not supported");
            return;
        }
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    // finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            if (isCaptionsEnabled) setLiveCaption(interimTranscript);
            if (isAiPacing) {
                // Logic for AI Pacing
                const spokenWords = interimTranscript.toLowerCase().split(' ');
                const scriptWords = script.toLowerCase().split(' ');
                // Simple matching logic
                let matchIndex = scriptWords.lastIndexOf(spokenWords[spokenWords.length - 1]);
                if (matchIndex > -1) {
                    currentWordIndexRef.current = matchIndex;
                    const lineHeight = teleprompterFontSize * 1.2;
                    teleprompterScrollRef.current = Math.max(0, (matchIndex / 5) * lineHeight); // Approx 5 words per line
                }
            }
        };
        speechRecognitionRef.current = recognition;
    }, [isCaptionsEnabled, isAiPacing, script, teleprompterFontSize]);


    const handleHighlightKeywords = async () => {
        if (!script) return;
        setIsHighlighting(true);
        try {
            const keywords = await getKeywordsFromScript(script);
            setHighlightedKeywords(keywords);
        } catch (e) {
            console.error("Failed to highlight keywords:", e);
        } finally {
            setIsHighlighting(false);
        }
    };
    
    const handleDeleteTake = (id: string) => {
        setTakes(takes.filter(take => take.id !== id));
    };

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-2xl shadow-black/20 p-6 backdrop-blur-lg space-y-4">
             <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                <video ref={videoRef} className="hidden" playsInline />
                <canvas ref={canvasRef} className="w-full h-full" />
                 {!stream && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button onClick={startCamera} className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600">
                           Start Camera
                        </button>
                    </div>
                )}
                 {isLoadingEffects && stream && (
                     <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <p className="text-white">Loading AI effects...</p>
                    </div>
                 )}
            </div>
            
            {/* --- CONTROLS --- */}
            {stream && <div className="space-y-4">
                 <div className="flex justify-center">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isLoadingEffects}
                        className={`flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ${
                        isRecording
                            ? 'bg-red-600 text-white shadow-red-500/50'
                            : 'bg-white text-red-600 shadow-white/50'
                        } shadow-lg transform hover:scale-110 disabled:opacity-50 disabled:scale-100`}
                    >
                        {isRecording ? <StopIcon className="w-10 h-10" /> : <RecordIcon className="w-10 h-10" />}
                    </button>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {/* Effects */}
                    <button onClick={() => setIsEffectsPanelOpen(!isEffectsPanelOpen)} disabled={isLoadingEffects} className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50">Effects</button>
                    {/* AR */}
                    <button onClick={() => setIsArPanelOpen(!isArPanelOpen)} disabled={isLoadingEffects} className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50">AR</button>
                    {/* Gestures */}
                    <button onClick={() => setIsGestureControlEnabled(!isGestureControlEnabled)} disabled={isLoadingEffects} className={`p-2 rounded-lg ${isGestureControlEnabled ? 'bg-yellow-500 text-black' : 'bg-gray-700'} disabled:opacity-50`}>Gestures</button>
                    {/* Captions */}
                    <button onClick={() => setIsCaptionsEnabled(!isCaptionsEnabled)} className={`p-2 rounded-lg ${isCaptionsEnabled ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`}>Captions</button>
                 </div>

                 {/* Effects Panel */}
                 {isEffectsPanelOpen && (
                     <div className="bg-gray-900/50 p-3 rounded-lg space-y-2">
                        <h4 className="font-semibold text-center">Background Effects</h4>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => setBackgroundEffect('none')} className={`p-2 rounded ${backgroundEffect === 'none' ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`}>None</button>
                            <button onClick={() => setBackgroundEffect('blur')} className={`p-2 rounded ${backgroundEffect === 'blur' ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`}>Blur</button>
                             <label className={`p-2 rounded text-center cursor-pointer ${backgroundEffect === 'image' ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`}>
                                Image <input type="file" accept="image/*" onChange={handleBgImageUpload} className="hidden" />
                             </label>
                        </div>
                     </div>
                 )}
                 {/* AR Panel */}
                 {isArPanelOpen && (
                     <div className="bg-gray-900/50 p-3 rounded-lg space-y-2">
                        <h4 className="font-semibold text-center">AR Effects</h4>
                        <div className="grid grid-cols-5 gap-2">
                            <button onClick={() => setArEffect('none')} className={`p-2 rounded ${arEffect === 'none' ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`}>Off</button>
                             <button onClick={() => setArEffect('glasses')} className={`p-2 rounded ${arEffect === 'glasses' ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`}>Glasses</button>
                             <button onClick={() => setArEffect('hat')} className={`p-2 rounded ${arEffect === 'hat' ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`}>Hat</button>
                             <button onClick={() => setArEffect('nose')} className={`p-2 rounded ${arEffect === 'nose' ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`}>Nose</button>
                             <button onClick={() => setArEffect('smoothing')} className={`p-2 rounded ${arEffect === 'smoothing' ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`}>Smooth</button>
                        </div>
                     </div>
                 )}

                {/* Teleprompter Panel */}
                <div className="bg-gray-900/50 p-3 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                         <h4 className="font-semibold">Teleprompter</h4>
                         <button onClick={() => setIsTeleprompterVisible(!isTeleprompterVisible)} className={`px-3 py-1 text-xs rounded-full ${isTeleprompterVisible ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`}>{isTeleprompterVisible ? 'On' : 'Off'}</button>
                    </div>
                    {isTeleprompterVisible && (
                        !script ? <p className="text-center text-gray-400 text-sm">Write a script below to use the teleprompter.</p> :
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setIsAiPacing(!isAiPacing)} className={`p-2 rounded ${isAiPacing ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`}>AI Pacing</button>
                                <button onClick={handleHighlightKeywords} disabled={isHighlighting} className="p-2 bg-gray-700 rounded disabled:opacity-50">{isHighlighting ? '...' : 'Keywords'}</button>
                            </div>
                             <div>
                                <label className="text-xs">Speed</label>
                                <input type="range" min="0.2" max="5" step="0.1" value={teleprompterSpeed} onChange={e => setTeleprompterSpeed(Number(e.target.value))} className="w-full" />
                            </div>
                            <div>
                                <label className="text-xs">Font Size</label>
                                <input type="range" min="14" max="72" step="2" value={teleprompterFontSize} onChange={e => setTeleprompterFontSize(Number(e.target.value))} className="w-full" />
                            </div>
                            {/* Font, Color, BG Color controls... */}
                        </div>
                    )}
                </div>

            </div>}

            {/* --- TAKES LIST --- */}
            {takes.length > 0 && (
                <div className="space-y-3">
                    <h3 className="font-semibold text-lg text-gray-300 border-t border-gray-700 pt-4">Your Takes</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {takes.map(take => (
                            <div key={take.id} className={`p-3 rounded-lg transition-colors ${selectedTakeId === take.id ? 'bg-yellow-500/20' : 'bg-gray-900/50'}`}>
                                <div className="flex items-center gap-4">
                                    <video src={take.url} className="w-24 h-14 object-cover rounded bg-black" controls />
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold">Take #{takes.findIndex(t => t.id === take.id) + 1}</p>
                                            {take.analysis && (
                                                <div title={take.analysis.justification} className="text-sm font-bold text-yellow-400">
                                                    {take.analysis.score}/10
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 capitalize">{take.status}...</p>
                                        {take.id === recommendedTakeId && <p className="text-xs font-bold text-yellow-400 mt-1">Recommended</p>}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => onSelectTake(take)} disabled={take.status !== 'complete'} className="px-3 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50">Use</button>
                                        <button onClick={() => onEditTake(take)} disabled={take.status !== 'complete'} className="px-3 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50">Edit</button>
                                        <button onClick={() => handleDeleteTake(take.id)} className="px-3 py-1 text-xs bg-red-800/50 rounded hover:bg-red-800"><TrashIcon className="w-4 h-4 mx-auto"/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};