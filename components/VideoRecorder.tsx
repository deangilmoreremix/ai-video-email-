import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppLibs } from '../contexts/AppContext';
import { generateTranscriptFromVideo, analyzeTranscriptForQuality, getKeywordsFromScript } from '../services/geminiService';
import {
    RecordIcon, StopIcon, TrashIcon, SparklesIcon, DropletIcon, ImageIcon, ScrollIcon,
    FaceSmileIcon, HandIcon, CaptionsIcon, PartyHatIcon, SmoothIcon
} from './icons';

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
    onError: (message: string) => void; // New prop for error handling
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({ script, takes, setTakes, onSelectTake, onEditTake, selectedTakeId, onError }) => {
    const { mediaPipeEffects, getGoogleGenAIInstance } = useAppLibs();
    const [isRecording, setIsRecording] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const isProcessingFrameRef = useRef(false);
    const recordedChunksRef = useRef<Blob[]>([]);
    
    const [isEffectsPanelOpen, setIsEffectsPanelOpen] = useState(false);
    const [isArPanelOpen, setIsArPanelOpen] = useState(false);
    
    const [backgroundEffect, setBackgroundEffect] = useState<'none' | 'blur' | 'image'>('none');
    const [virtualBgImage, setVirtualBgImage] = useState<HTMLImageElement | null>(null);
    const [arEffect, setArEffect] = useState<'none' | 'glasses' | 'hat' | 'nose' | 'smoothing'>('none');
    const [isGestureControlEnabled, setIsGestureControlEnabled] = useState(false);
    const [isCaptionsEnabled, setIsCaptionsEnabled] = useState(false);
    const [liveCaption, setLiveCaption] = useState('');

    const [isTeleprompterVisible, setIsTeleprompterVisible] = useState(false);
    const [teleprompterSpeed, setTeleprompterSpeed] = useState(1);
    const [teleprompterFontSize, setTeleprompterFontSize] = useState(24);
    const [teleprompterFont, setTeleprompterFont] = useState('Arial'); // Default font
    const [teleprompterTextColor, setTeleprompterTextColor] = useState('#FFFFFF'); // Default text color
    const [teleprompterBgColor, setTeleprompterBgColor] = useState('rgba(0, 0, 0, 0.5)');
    const [teleprompterLineHeight, setTeleprompterLineHeight] = useState(1.2); // Default line height multiplier
    const [teleprompterTextAlign, setTeleprompterTextAlign] = useState<'left' | 'center' | 'right'>('center'); // Default alignment

    const [isAiPacing, setIsAiPacing] = useState(false);
    const [highlightedKeywords, setHighlightedKeywords] = useState<string[]>([]);
    const [isHighlighting, setIsHighlighting] = useState(false);

    const teleprompterScrollRef = useRef(0);
    const precomputedLinesRef = useRef<string[]>([]);
    const currentWordIndexRef = useRef(-1); // Changed default to -1 to indicate no word matched yet

    const speechRecognitionRef = useRef<any>(null);
    const hasSpeechRecognition = 'webkitSpeechRecognition' in window;
    
    const recommendedTakeId = useMemo(() => {
        const completedTakes = takes.filter(t => t.analysis);
        if (completedTakes.length === 0) return null;
        return completedTakes.reduce((best, current) =>
            current.analysis!.score > best.analysis!.score ? current : best
        ).id;
    }, [takes]);

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            stream?.getTracks().forEach(track => track.stop());
        };
    }, [stream]);
    
    const startRecording = useCallback(async () => {
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
            
            setTakes(prev => prev.map(t => t.id === newTakeId ? { ...t, blob, url, status: 'transcribing' } : t));
            
            try {
                // Use the updated getGoogleGenAIInstance for API calls
                // No special API key selection for this model, so default to false
                const ai = await getGoogleGenAIInstance(false);
                const transcript = await generateTranscriptFromVideo(blob);
                setTakes(prev => prev.map(t => t.id === newTakeId ? { ...t, transcript, status: 'analyzing' } : t));
                
                const analysis = await analyzeTranscriptForQuality(transcript);
                setTakes(prev => prev.map(t => t.id === newTakeId ? { ...t, analysis, status: 'complete' } : t));

            } catch (error: any) {
                console.error("Failed to process take:", error);
                onError(`Failed to process take: ${error.message || 'Unknown error'}. Please ensure your API Key is valid.`);
                 setTakes(prev => prev.map(t => t.id === newTakeId ? { ...t, status: 'failed' } : t));
            }
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        teleprompterScrollRef.current = 0;
        currentWordIndexRef.current = -1; // Reset word index on new recording
        if (isCaptionsEnabled && hasSpeechRecognition) speechRecognitionRef.current?.start();
    }, [stream, isRecording, setTakes, isCaptionsEnabled, hasSpeechRecognition, getGoogleGenAIInstance, onError]); // Added onError to dependencies

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (isCaptionsEnabled && hasSpeechRecognition) speechRecognitionRef.current?.stop();
        }
    }, [isRecording, isCaptionsEnabled, hasSpeechRecognition]);

    const detectGesture = useCallback((landmarks: any[]) => {
        if (!landmarks || landmarks.length === 0) return;
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const wrist = landmarks[0];

        // Example gesture: "Thumb up" to start recording
        // This is a very basic check, more robust gesture recognition would be complex.
        if (thumbTip.y < indexTip.y && thumbTip.y < wrist.y) {
            if (!isRecording) startRecording();
        }
        // Example gesture: "Open hand" to stop recording (all finger tips above wrist)
        // This is also a very basic check.
        else if (
            landmarks[8].y < landmarks[5].y && // Index finger tip above its base
            landmarks[12].y < landmarks[9].y && // Middle finger tip above its base
            landmarks[16].y < landmarks[13].y && // Ring finger tip above its base
            landmarks[20].y < landmarks[17].y // Pinky finger tip above its base
        ) {
             if (isRecording) stopRecording();
        }
    }, [isRecording, startRecording, stopRecording]);

    const processFrame = useCallback(async () => {
        if (isProcessingFrameRef.current || !videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.ended) {
            animationFrameRef.current = requestAnimationFrame(processFrame);
            return;
        }

        isProcessingFrameRef.current = true;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
            isProcessingFrameRef.current = false;
            return;
        }

        const startTimeMs = performance.now();
        
        const drawTeleprompter = (ctx: CanvasRenderingContext2D) => {
            const lines = precomputedLinesRef.current;
            if (!lines.length) return;

            const lineHeight = teleprompterFontSize * teleprompterLineHeight;
            const canvasHeight = ctx.canvas.height;
            let currentScrollPosition = teleprompterScrollRef.current;

            if (isAiPacing) { // AI Pacing overrides continuous scroll
                const matchIndex = currentWordIndexRef.current;
                if (matchIndex > -1) {
                    let wordsCounted = 0;
                    let targetLineIndex = 0;
                    for (let i = 0; i < lines.length; i++) {
                        const lineWords = lines[i].split(' ').filter(w => w.length > 0);
                        if (wordsCounted + lineWords.length > matchIndex) {
                            targetLineIndex = i;
                            break;
                        }
                        wordsCounted += lineWords.length;
                    }
                    // Scroll to center the target line vertically
                    currentScrollPosition = Math.max(0, (targetLineIndex * lineHeight) - (canvasHeight / 2 - lineHeight / 2));
                }
            } else { // Continuous scroll when AI Pacing is off
                currentScrollPosition += teleprompterSpeed;
            }
            
            // Update the ref after computation
            teleprompterScrollRef.current = currentScrollPosition;
            
            const totalContentHeight = lines.length * lineHeight;
            // Reset scroll only if it goes significantly past the content end
            if (currentScrollPosition > totalContentHeight + canvasHeight / 2) {
                teleprompterScrollRef.current = 0; // Reset scroll if it goes too far
            }
            // Clamp scroll position to prevent negative or excessive scrolling
            teleprompterScrollRef.current = Math.max(0, Math.min(teleprompterScrollRef.current, totalContentHeight + canvasHeight/2));


            ctx.save();
            ctx.fillStyle = teleprompterBgColor;
            ctx.fillRect(50, 0, canvas.width - 100, canvasHeight);

            ctx.font = `${teleprompterFontSize}px ${teleprompterFont}`;
            
            const startY = canvasHeight / 2 - currentScrollPosition;

            lines.forEach((line, index) => {
                const y = startY + index * lineHeight;
                if (y > -lineHeight && y < canvasHeight + lineHeight) {
                    // Determine line start X based on alignment
                    let lineStartX: number;
                    if (teleprompterTextAlign === 'left') {
                        ctx.textAlign = 'left';
                        lineStartX = 60; // Left margin
                    } else if (teleprompterTextAlign === 'right') {
                        ctx.textAlign = 'right';
                        lineStartX = canvas.width - 60; // Right margin
                    } else { // 'center'
                        ctx.textAlign = 'center';
                        lineStartX = canvas.width / 2; // Center
                    }

                    // Draw the entire line first in default color
                    ctx.fillStyle = teleprompterTextColor;
                    ctx.fillText(line, lineStartX, y);

                    // Then, overlay highlighted keywords
                    const wordsInLine = line.split(' ').filter(w => w.length > 0);
                    let currentWordDrawX = lineStartX;
                    if (teleprompterTextAlign === 'center') {
                        currentWordDrawX -= ctx.measureText(line).width / 2;
                    } else if (teleprompterTextAlign === 'right') {
                        currentWordDrawX -= ctx.measureText(line).width;
                    }

                    wordsInLine.forEach(word => {
                        const isKeyword = highlightedKeywords.some(keyword => word.toLowerCase().includes(keyword.toLowerCase()));
                        if (isKeyword) {
                            ctx.fillStyle = '#facc15'; // Highlight color
                            ctx.fillText(word, currentWordDrawX, y);
                        }
                        currentWordDrawX += ctx.measureText(word + ' ').width; // Update for next word
                    });
                }
            });
            ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
            ctx.fillRect(40, canvasHeight / 2 - 2, 10, 4);
            ctx.fillRect(canvas.width - 50, canvasHeight / 2 - 2, 10, 4);
            ctx.restore();
        };
        const drawLiveCaptions = (ctx: CanvasRenderingContext2D) => {
            ctx.save();
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            const x = ctx.canvas.width / 2;
            const y = ctx.canvas.height - 30;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            const textMetrics = ctx.measureText(liveCaption);
            ctx.fillRect(x - textMetrics.width / 2 - 10, y - 30, textMetrics.width + 20, 40);
            ctx.fillStyle = 'white';
            ctx.fillText(liveCaption, x, y);
            ctx.restore();
        };
        const drawArEffects = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
            if (!landmarks || landmarks.length === 0) return;
            switch (arEffect) {
                case 'glasses': {
                    const leftEye = landmarks[130];
                    const rightEye = landmarks[359];
                    const noseBridge = landmarks[168];
                    if (leftEye && rightEye && noseBridge) {
                        const eyeRadius = Math.abs(landmarks[33].x - landmarks[133].x) * ctx.canvas.width / 4;
                        ctx.strokeStyle = 'black';
                        ctx.lineWidth = 5;
                        ctx.beginPath();
                        ctx.arc(leftEye.x * ctx.canvas.width, leftEye.y * ctx.canvas.height, eyeRadius, 0, 2 * Math.PI);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(rightEye.x * ctx.canvas.width, rightEye.y * ctx.canvas.height, eyeRadius, 0, 2 * Math.PI);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(leftEye.x * ctx.canvas.width + eyeRadius, leftEye.y * ctx.canvas.height);
                        ctx.lineTo(noseBridge.x * ctx.canvas.width, noseBridge.y * ctx.canvas.height);
                        ctx.lineTo(rightEye.x * ctx.canvas.width - eyeRadius, rightEye.y * ctx.canvas.height);
                        ctx.stroke();
                    }
                    break;
                }
                case 'hat': {
                    const topOfHead = landmarks[10];
                    const leftTemple = landmarks[234];
                    const rightTemple = landmarks[454];
                    if(topOfHead && leftTemple && rightTemple) {
                        const hatBaseY = (leftTemple.y + rightTemple.y)/2 * ctx.canvas.height;
                        ctx.fillStyle = '#4a5568';
                        ctx.beginPath();
                        ctx.moveTo(leftTemple.x * ctx.canvas.width, hatBaseY);
                        ctx.lineTo(rightTemple.x * ctx.canvas.width, hatBaseY);
                        ctx.lineTo(topOfHead.x * ctx.canvas.width, (topOfHead.y * ctx.canvas.height) - ((rightTemple.x - leftTemple.x) * ctx.canvas.width * 0.4));
                        ctx.closePath();
                        ctx.fill();
                    }
                    break;
                }
                case 'nose': {
                    const noseTip = landmarks[1];
                    if (noseTip) {
                        ctx.fillStyle = 'red';
                        ctx.beginPath();
                        ctx.arc(noseTip.x * ctx.canvas.width, noseTip.y * ctx.canvas.height, 10, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                    break;
                }
            }
        };

        const drawBaseLayer = new Promise<void>((resolve) => {
            if (backgroundEffect !== 'none' && mediaPipeEffects?.segmenter) {
                mediaPipeEffects.segmenter.segmentForVideo(video, startTimeMs, (result: any) => {
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
                    resolve();
                });
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                resolve();
            }
        });

        await drawBaseLayer;

        if (arEffect !== 'none' && mediaPipeEffects?.faceMesh) {
            const result = mediaPipeEffects.faceMesh.detectForVideo(video, startTimeMs);
            if (result.faceLandmarks && result.faceLandmarks[0]) {
                drawArEffects(ctx, result.faceLandmarks[0]);
            }
        }
        if (isGestureControlEnabled && mediaPipeEffects?.handLandmarker) {
            const result = mediaPipeEffects.handLandmarker.detectForVideo(video, startTimeMs);
            if (result.landmarks && result.landmarks.length > 0) {
                detectGesture(result.landmarks[0]);
            }
        }
        if (isTeleprompterVisible && precomputedLinesRef.current.length > 0) {
            drawTeleprompter(ctx);
        }
        if (isCaptionsEnabled && liveCaption) {
            drawLiveCaptions(ctx);
        }

        isProcessingFrameRef.current = false;
        animationFrameRef.current = requestAnimationFrame(processFrame);
    }, [
        backgroundEffect, virtualBgImage, arEffect, isGestureControlEnabled, 
        isTeleprompterVisible, isCaptionsEnabled, liveCaption, mediaPipeEffects, detectGesture,
        teleprompterBgColor, teleprompterTextColor, teleprompterFont, teleprompterFontSize,
        isAiPacing, teleprompterSpeed, highlightedKeywords, // Added for teleprompter highlighting
        teleprompterLineHeight, teleprompterTextAlign // Added new teleprompter states
    ]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onloadedmetadata = () => {
                    if (videoRef.current) {
                         videoRef.current.play();
                         if(canvasRef.current) {
                            canvasRef.current.width = videoRef.current.videoWidth;
                            canvasRef.current.height = videoRef.current.videoHeight;
                         }
                         animationFrameRef.current = requestAnimationFrame(processFrame);
                    }
                };
            }
        } catch (err: any) {
            console.error("Error accessing camera:", err);
            // Provide user feedback on camera access failure
            onError("Failed to access camera. Please ensure camera permissions are granted and no other application is using it.");
        }
    };
    
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

    useEffect(() => {
        if (!canvasRef.current || !script) {
            precomputedLinesRef.current = []; return;
        }
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        
        // Ensure font is set correctly for accurate text measurement
        ctx.font = `${teleprompterFontSize}px ${teleprompterFont}`;
        const maxWidth = ctx.canvas.width - 140; // Reduced width for padding/margins
        const words = script.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine + word + ' ';
            // If the test line is too wide, or if it's the first word and it's too wide
            // (in which case, the word itself might be longer than maxWidth, but we push it anyway)
            if (ctx.measureText(testLine).width > maxWidth && currentLine !== '') {
                lines.push(currentLine.trim());
                currentLine = word + ' ';
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine.trim()); // Push the last line
        precomputedLinesRef.current = lines;

    }, [script, teleprompterFontSize, teleprompterFont, teleprompterLineHeight, teleprompterTextAlign]); // Added all relevant teleprompter style properties to dependencies

    useEffect(() => {
        if (!hasSpeechRecognition) return; // Only initialize if supported
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                interimTranscript += event.results[i][0].transcript;
            }
            if (isCaptionsEnabled) setLiveCaption(interimTranscript);
            
            // Only update currentWordIndexRef if AI Pacing is enabled
            if (isAiPacing) {
                const spokenWords = interimTranscript.toLowerCase().split(' ').filter(w => w.length > 0);
                if (spokenWords.length > 0) {
                    const lastSpokenWord = spokenWords[spokenWords.length - 1];
                    const scriptWords = script.toLowerCase().split(' ').filter(w => w.length > 0);
                    
                    let matchIndex = -1;
                    // Find the index of the first script word that contains the last spoken word
                    // Start search from currentWordIndexRef.current to avoid rewinding unnecessarily
                    for (let i = currentWordIndexRef.current === -1 ? 0 : currentWordIndexRef.current; i < scriptWords.length; i++) {
                        if (scriptWords[i].includes(lastSpokenWord)) {
                            matchIndex = i;
                            break; 
                        }
                    }
                    if (matchIndex > -1) {
                        currentWordIndexRef.current = matchIndex;
                    }
                }
            }
        };
        
        recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            if (isCaptionsEnabled) {
                 setLiveCaption("Speech recognition error. Check microphone permissions.");
                 onError("Speech recognition error. Check microphone permissions.");
                 // Optionally disable captions if persistent error
                 // setIsCaptionsEnabled(false);
            }
        };
        
        speechRecognitionRef.current = recognition;
    }, [isCaptionsEnabled, isAiPacing, script, hasSpeechRecognition, onError]); // Dependencies for speech recognition

    const handleHighlightKeywords = async () => {
        if (!script) return;
        setIsHighlighting(true);
        try {
            // Use the updated getGoogleGenAIInstance for API calls
            // No special API key selection for this model, so default to false
            const ai = await getGoogleGenAIInstance(false);
            const keywords = await getKeywordsFromScript(script);
            setHighlightedKeywords(keywords);
        } catch (e: any) { 
            console.error("Failed to highlight keywords:", e); 
            onError(`Failed to highlight keywords: ${e.message || 'Unknown error'}. Please ensure your API Key is valid.`);
        }
        finally { setIsHighlighting(false); }
    };
    
    const handleDeleteTake = (id: string) => {
        setTakes(takes.filter(take => take.id !== id));
    };

    const handleTeleprompterWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault(); // Prevent page scroll
        if (isAiPacing) return; // Disable manual scroll if AI Pacing is active

        const scrollAmount = e.deltaY * 0.5; // Adjust scroll sensitivity
        let newScrollPosition = teleprompterScrollRef.current + scrollAmount;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const lineHeight = teleprompterFontSize * teleprompterLineHeight;
        const totalContentHeight = precomputedLinesRef.current.length * lineHeight;
        const maxScroll = Math.max(0, totalContentHeight - canvas.height / 2); // Max scroll to keep content in view

        newScrollPosition = Math.max(0, Math.min(newScrollPosition, maxScroll));
        teleprompterScrollRef.current = newScrollPosition;
        animationFrameRef.current = requestAnimationFrame(processFrame); // Request redraw
    }, [isAiPacing, teleprompterFontSize, teleprompterLineHeight, processFrame]);


    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-2xl shadow-black/20 p-6 backdrop-blur-lg space-y-4">
             <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                <video ref={videoRef} className="hidden" playsInline />
                <canvas ref={canvasRef} className="w-full h-full" aria-label="Live video preview with effects and teleprompter" />
                {isTeleprompterVisible && precomputedLinesRef.current.length > 0 && !isAiPacing && (
                    <div 
                        className="absolute inset-0 z-10 cursor-ns-resize" 
                        onWheel={handleTeleprompterWheel} 
                        aria-hidden="true" // Hide from accessibility tree, as it's a visual interaction overlay
                        title="Scroll to adjust teleprompter position"
                    ></div>
                )}
                 {!stream && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button onClick={startCamera} className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600" aria-label="Start Camera">
                           Start Camera
                        </button>
                    </div>
                )}
            </div>
            
            {stream && <div className="space-y-4">
                 <div className="flex justify-center">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ${
                        isRecording
                            ? 'bg-red-600 text-white shadow-red-500/50'
                            : 'bg-white text-red-600 shadow-white/50'
                        } shadow-lg transform hover:scale-110`}
                        aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
                        role="button"
                    >
                        {isRecording ? <StopIcon className="w-10 h-10" /> : <RecordIcon className="w-10 h-10" />}
                    </button>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm" role="group" aria-label="Video recording controls">
                    <button onClick={() => setIsEffectsPanelOpen(!isEffectsPanelOpen)} disabled={!mediaPipeEffects} className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50" aria-expanded={isEffectsPanelOpen} aria-controls="effects-panel">Effects</button>
                    <button onClick={() => setIsArPanelOpen(!isArPanelOpen)} disabled={!mediaPipeEffects} className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50" aria-expanded={isArPanelOpen} aria-controls="ar-panel">AR</button>
                    <button onClick={() => setIsGestureControlEnabled(!isGestureControlEnabled)} disabled={!mediaPipeEffects} className={`p-2 rounded-lg ${isGestureControlEnabled ? 'bg-yellow-500 text-black' : 'bg-gray-700'} disabled:opacity-50`} aria-pressed={isGestureControlEnabled}>Gestures</button>
                    <button 
                        onClick={() => setIsCaptionsEnabled(!isCaptionsEnabled)} 
                        disabled={!hasSpeechRecognition} 
                        className={`p-2 rounded-lg ${isCaptionsEnabled ? 'bg-yellow-500 text-black' : 'bg-gray-700'} ${!hasSpeechRecognition ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-pressed={isCaptionsEnabled}
                        title={!hasSpeechRecognition ? "Live captions require browser speech recognition support (e.g., Chrome)" : undefined}
                    >
                        Captions
                    </button>
                 </div>

                 {isEffectsPanelOpen && (
                     <div id="effects-panel" className="bg-gray-900/50 p-3 rounded-lg space-y-2" role="region" aria-label="Background effects panel">
                        <h4 className="font-semibold text-center">Background Effects</h4>
                        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="background-effects-heading">
                            <button id="background-effects-heading" onClick={() => setBackgroundEffect('none')} className={`p-2 rounded ${backgroundEffect === 'none' ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`} aria-pressed={backgroundEffect === 'none'} role="radio">None</button>
                            <button onClick={() => setBackgroundEffect('blur')} className={`p-2 rounded ${backgroundEffect === 'blur' ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`} aria-pressed={backgroundEffect === 'blur'} role="radio">Blur</button>
                             <label className={`p-2 rounded text-center cursor-pointer ${backgroundEffect === 'image' ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`} aria-label="Upload background image">
                                Image <input type="file" accept="image/*" onChange={handleBgImageUpload} className="hidden" />
                             </label>
                        </div>
                     </div>
                 )}
                 {isArPanelOpen && (
                     <div id="ar-panel" className="bg-gray-900/50 p-3 rounded-lg space-y-2" role="region" aria-label="AR effects panel">
                        <h4 className="font-semibold text-center">AR Effects</h4>
                        <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-labelledby="ar-effects-heading">
                            <button id="ar-effects-heading" onClick={() => setArEffect('none')} className={`p-2 rounded ${arEffect === 'none' ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`} aria-pressed={arEffect === 'none'} role="radio">Off</button>
                             <button onClick={() => setArEffect('glasses')} className={`p-2 rounded ${arEffect === 'glasses' ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`} aria-pressed={arEffect === 'glasses'} role="radio">Glasses</button>
                             <button onClick={() => setArEffect('hat')} className={`p-2 rounded ${arEffect === 'hat' ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`} aria-pressed={arEffect === 'hat'} role="radio">Hat</button>
                             <button onClick={() => setArEffect('nose')} className={`p-2 rounded ${arEffect === 'nose' ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`} aria-pressed={arEffect === 'nose'} role="radio">Nose</button>
                             <button onClick={() => setArEffect('smoothing')} className={`p-2 rounded ${arEffect === 'smoothing' ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`} aria-pressed={arEffect === 'smoothing'} role="radio">Smooth</button>
                        </div>
                     </div>
                 )}

                <div className="bg-gray-900/50 p-3 rounded-lg space-y-3" role="group" aria-label="Teleprompter settings">
                    <div className="flex items-center justify-between">
                         <h4 className="font-semibold">Teleprompter</h4>
                         <button onClick={() => setIsTeleprompterVisible(!isTeleprompterVisible)} className={`px-3 py-1 text-xs rounded-full ${isTeleprompterVisible ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`} aria-pressed={isTeleprompterVisible} aria-label={`Toggle teleprompter ${isTeleprompterVisible ? 'on' : 'off'}`}>{isTeleprompterVisible ? 'On' : 'Off'}</button>
                    </div>
                    {isTeleprompterVisible && (
                        !script ? <p className="text-center text-gray-400 text-sm">Write a script to use the teleprompter.</p> :
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setIsAiPacing(!isAiPacing)} className={`p-2 rounded ${isAiPacing ? 'bg-yellow-500 text-black' : 'bg-gray-700'}`} aria-pressed={isAiPacing}>AI Pacing</button>
                                <button onClick={handleHighlightKeywords} disabled={isHighlighting} className="p-2 bg-gray-700 rounded disabled:opacity-50" aria-label={isHighlighting ? 'Highlighting Keywords' : 'Highlight Keywords'}>{isHighlighting ? '...' : 'Keywords'}</button>
                            </div>
                             <div>
                                <label htmlFor="teleprompter-speed" className="text-xs block">Speed</label>
                                <input id="teleprompter-speed" type="range" min="0.2" max="5" step="0.1" value={teleprompterSpeed} onChange={e => setTeleprompterSpeed(Number(e.target.value))} className="w-full" aria-valuenow={teleprompterSpeed} aria-valuemin={0.2} aria-valuemax={5} />
                            </div>
                            <div>
                                <label htmlFor="teleprompter-font-size" className="text-xs block">Font Size</label>
                                <input id="teleprompter-font-size" type="range" min="14" max="72" step="2" value={teleprompterFontSize} onChange={e => setTeleprompterFontSize(Number(e.target.value))} className="w-full" aria-valuenow={teleprompterFontSize} aria-valuemin={14} aria-valuemax={72} />
                            </div>
                            <div>
                                <label htmlFor="teleprompter-line-height" className="text-xs block">Line Spacing</label>
                                <input id="teleprompter-line-height" type="range" min="1.0" max="2.5" step="0.1" value={teleprompterLineHeight} onChange={e => setTeleprompterLineHeight(Number(e.target.value))} className="w-full" aria-valuenow={teleprompterLineHeight} aria-valuemin={1.0} aria-valuemax={2.5} />
                            </div>
                            <div>
                                <label className="text-xs block">Text Alignment</label>
                                <div className="flex gap-2 mt-1" role="radiogroup" aria-labelledby="teleprompter-text-alignment-label">
                                    {(['left', 'center', 'right'] as const).map(align => (
                                        <button
                                            key={align}
                                            onClick={() => setTeleprompterTextAlign(align)}
                                            className={`flex-1 p-2 rounded ${teleprompterTextAlign === align ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-gray-600'}`}
                                            aria-pressed={teleprompterTextAlign === align}
                                            aria-label={`Align text ${align}`}
                                            id={`teleprompter-text-alignment-label-${align}`}
                                        >
                                            {align.charAt(0).toUpperCase() + align.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <label htmlFor="teleprompter-font-family" className="text-xs block">Font Family</label>
                                <select id="teleprompter-font-family" value={teleprompterFont} onChange={e => setTeleprompterFont(e.target.value)} className="w-full p-2 bg-gray-700 rounded-lg" aria-label="Select teleprompter font family">
                                    <option value="Arial">Arial</option>
                                    <option value="Verdana">Verdana</option>
                                    <option value="Georgia">Georgia</option>
                                    <option value="Roboto">Roboto</option>
                                    <option value="Open Sans">Open Sans</option>
                                    <option value="sans-serif">System Sans-serif</option>
                                    <option value="serif">System Serif</option>
                                    <option value="monospace">System Monospace</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="teleprompter-text-color" className="text-xs block">Text Color</label>
                                <input id="teleprompter-text-color" type="color" value={teleprompterTextColor} onChange={e => setTeleprompterTextColor(e.target.value)} className="w-full h-8 rounded-lg cursor-pointer" aria-label="Teleprompter text color" />
                            </div>
                        </div>
                    )}
                </div>

            </div>}

            {takes.length > 0 && (
                <div className="space-y-3" role="region" aria-labelledby="your-takes-heading">
                    <h3 id="your-takes-heading" className="font-semibold text-lg text-gray-300 border-t border-gray-700 pt-4">Your Takes</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2" role="list">
                        {takes.map(take => (
                            <div key={take.id} className={`p-3 rounded-lg transition-colors ${selectedTakeId === take.id ? 'bg-yellow-500/20' : 'bg-gray-900/50'}`} role="listitem">
                                <div className="flex items-center gap-4">
                                    <video src={take.url} className="w-24 h-14 object-cover rounded bg-black" muted loop playsInline onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} aria-label={`Preview of Take ${takes.findIndex(t => t.id === take.id) + 1}`}/>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold">Take #{takes.findIndex(t => t.id === take.id) + 1}</p>
                                            {take.analysis && (
                                                <div title={take.analysis.justification} className="text-sm font-bold text-yellow-400" aria-label={`Analysis score: ${take.analysis.score} out of 10. ${take.analysis.justification}`}>
                                                    {take.analysis.score}/10
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 capitalize">{take.status}...</p>
                                        {take.id === recommendedTakeId && <p className="text-xs font-bold text-yellow-400 mt-1">Recommended</p>}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => onSelectTake(take)} disabled={take.status !== 'complete'} className="px-3 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50" aria-label={`Use Take ${takes.findIndex(t => t.id === take.id) + 1}`}>Use</button>
                                        <button onClick={() => onEditTake(take)} disabled={take.status !== 'complete'} className="px-3 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50" aria-label={`Edit Take ${takes.findIndex(t => t.id === take.id) + 1}`}>Edit</button>
                                        <button onClick={() => handleDeleteTake(take.id)} className="text-gray-400 hover:text-red-400" aria-label={`Delete Take ${takes.findIndex(t => t.id === take.id) + 1}`}><TrashIcon className="w-4 h-4 mx-auto"/></button>
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