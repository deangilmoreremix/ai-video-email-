import { GoogleGenAI, Modality, Type } from "@google/genai";
import { getGoogleGenAIInstance, blobToDataURL, handleGeminiError, retryWithBackoff } from './geminiService';
import { supabase } from '../lib/supabase';

// ============================================
// 1. VEO 2 VIDEO BACKGROUND GENERATION
// ============================================

export interface VeoGenerationRequest {
  prompt: string;
  duration: number;
  style: 'modern-tech' | 'cinematic' | 'abstract' | 'professional';
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export interface VeoGenerationResult {
  id: string;
  videoUrl: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
}

export const generateBRollWithVeo = async (request: VeoGenerationRequest): Promise<VeoGenerationResult> => {
  return retryWithBackoff(async () => {
    try {
      const ai = await getGoogleGenAIInstance(true); // Requires aistudio key for Veo

      const stylePrompts = {
        'modern-tech': 'sleek modern technology visualization with clean lines and glowing elements',
        'cinematic': 'cinematic professional footage with dramatic lighting and depth',
        'abstract': 'abstract artistic visualization with flowing shapes and colors',
        'professional': 'professional business environment with clean aesthetic'
      };

      const fullPrompt = `${stylePrompts[request.style]}. ${request.prompt}`;

      // Insert pending record
      const { data: userData } = await supabase.auth.getUser();
      const { data: bgRecord, error: insertError } = await supabase
        .from('veo_generated_backgrounds')
        .insert({
          user_id: userData?.user?.id,
          prompt: fullPrompt,
          duration: request.duration,
          style: request.style,
          status: 'processing'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call Veo 2 API for video generation
      const response = await ai.models.generateContent({
        model: 'veo-2',
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        config: {
          videoGeneration: {
            duration: request.duration,
            aspectRatio: request.aspectRatio || '16:9'
          }
        }
      });

      // Extract video URL from response
      const videoUrl = response.candidates?.[0]?.content?.parts?.[0]?.videoUrl || '';

      if (!videoUrl) {
        throw new Error('Veo 2 did not return a video URL. The model may not be available or the request may have failed.');
      }

      // Update record with video URL
      await supabase
        .from('veo_generated_backgrounds')
        .update({ video_url: videoUrl, status: 'complete' })
        .eq('id', bgRecord.id);

      return {
        id: bgRecord.id,
        videoUrl,
        status: 'complete'
      };
    } catch (error) {
      return handleGeminiError(error);
    }
  });
};

// ============================================
// 2. SMART VIDEO CHAPTER DETECTION
// ============================================

export interface VideoChapter {
  title: string;
  startTime: number;
  endTime: number;
  summary: string;
  thumbnailUrl?: string;
}

export const detectVideoChapters = async (videoBlob: Blob, transcript: string): Promise<VideoChapter[]> => {
  return retryWithBackoff(async () => {
    try {
      const ai = await getGoogleGenAIInstance(false);
      const videoBase64 = await blobToDataURL(videoBlob);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [{
          parts: [
            {
              text: `Analyze this video and identify natural topic boundaries to create chapters.
              For each chapter provide:
              - A descriptive title (3-8 words)
              - Start and end timestamps in seconds
              - A brief summary (1-2 sentences)

              Return ONLY a JSON array of chapter objects with keys: title, startTime, endTime, summary.

              Transcript: ${transcript}`
            },
            { inlineData: { mimeType: videoBlob.type, data: videoBase64.split(',')[1] } }
          ]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                startTime: { type: Type.NUMBER },
                endTime: { type: Type.NUMBER },
                summary: { type: Type.STRING }
              }
            }
          }
        }
      });

      const chapters = JSON.parse(response.text.trim());
      return chapters;
    } catch (error) {
      return handleGeminiError(error);
    }
  });
};

export const saveVideoChapters = async (videoId: string, chapters: VideoChapter[]): Promise<void> => {
  const chaptersToInsert = chapters.map(chapter => ({
    video_id: videoId,
    title: chapter.title,
    start_time: chapter.startTime,
    end_time: chapter.endTime,
    summary: chapter.summary,
    thumbnail_url: chapter.thumbnailUrl
  }));

  const { error } = await supabase
    .from('video_chapters')
    .insert(chaptersToInsert);

  if (error) throw error;
};

// ============================================
// 3. AI VOICE CLONING & DUBBING
// ============================================

export interface VoiceCloneRequest {
  audioBlob: Blob;
  targetText: string;
  language?: string;
}

export interface VoiceCloneResult {
  audioUrl: string;
  duration: number;
}

export const cloneVoiceAndDub = async (request: VoiceCloneRequest): Promise<VoiceCloneResult> => {
  return retryWithBackoff(async () => {
    try {
      const ai = await getGoogleGenAIInstance(false);
      const audioBase64 = await blobToDataURL(request.audioBlob);

      // Analyze voice characteristics
      const voiceAnalysis = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [{
          parts: [
            { text: `Analyze this voice sample and describe its characteristics: pitch, tone, pace, accent, and speaking style. Be detailed and specific.` },
            { inlineData: { mimeType: request.audioBlob.type, data: audioBase64.split(',')[1] } }
          ]
        }]
      });

      const voiceProfile = voiceAnalysis.text;

      // Use AI to analyze and generate voice-matched text-to-speech
      // Currently returning analysis only - full voice cloning requires additional APIs
      // This provides the voice profile that can be used with external TTS services
      // such as ElevenLabs, Google Cloud TTS, or Azure Speech

      // Store voice profile for future use
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        await supabase
          .from('voice_profiles')
          .upsert({
            user_id: userData.user.id,
            voice_characteristics: voiceProfile,
            language: request.language || 'en-US',
            created_at: new Date().toISOString()
          });
      }

      return {
        audioUrl: voiceProfile, // Contains voice analysis that can be used with TTS services
        duration: Math.ceil(request.targetText.length / 15)
      };
    } catch (error) {
      return handleGeminiError(error);
    }
  });
};

// ============================================
// 4. REAL-TIME COLLABORATION & FEEDBACK
// ============================================

export interface CollaborationSession {
  id: string;
  sessionCode: string;
  videoId: string;
  ownerId: string;
  activeCollaborators: Array<{ id: string; name: string; joinedAt: string }>;
  isActive: boolean;
  expiresAt: string;
}

export interface CollaborationFeedback {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  timestamp: number;
  comment: string;
  type: 'suggestion' | 'question' | 'approval';
  resolved: boolean;
  createdAt: string;
}

export const createCollaborationSession = async (videoId: string, durationHours: number = 24): Promise<CollaborationSession> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('collaboration_sessions')
    .insert({
      video_id: videoId,
      owner_id: userData.user.id,
      session_code: sessionCode,
      expires_at: expiresAt
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    sessionCode: data.session_code,
    videoId: data.video_id,
    ownerId: data.owner_id,
    activeCollaborators: [],
    isActive: data.is_active,
    expiresAt: data.expires_at
  };
};

export const addCollaborationFeedback = async (
  sessionId: string,
  timestamp: number,
  comment: string,
  type: 'suggestion' | 'question' | 'approval'
): Promise<CollaborationFeedback> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('collaboration_feedback')
    .insert({
      session_id: sessionId,
      user_id: userData.user.id,
      timestamp,
      comment,
      type
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    sessionId: data.session_id,
    userId: data.user_id,
    userName: userData.user.email || 'Anonymous',
    timestamp: data.timestamp,
    comment: data.comment,
    type: data.type,
    resolved: data.resolved,
    createdAt: data.created_at
  };
};

export const getCollaborationFeedback = async (sessionId: string): Promise<CollaborationFeedback[]> => {
  const { data, error } = await supabase
    .from('collaboration_feedback')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true });

  if (error) throw error;

  return data.map(item => ({
    id: item.id,
    sessionId: item.session_id,
    userId: item.user_id,
    userName: 'Collaborator', // Would need to join with user data
    timestamp: item.timestamp,
    comment: item.comment,
    type: item.type,
    resolved: item.resolved,
    createdAt: item.created_at
  }));
};

// ============================================
// 5. SMART VIDEO TEMPLATES
// ============================================

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: 'pitch' | 'demo' | 'onboarding' | 'thank-you' | 'tutorial' | 'general';
  duration: number;
  placeholders: Array<{ key: string; label: string; type: 'text' | 'image' | 'video' }>;
  styleConfig: {
    primaryColor: string;
    fontFamily: string;
    logoPosition: 'top-left' | 'top-right' | 'center';
  };
  isPublic: boolean;
  usageCount: number;
}

export const createVideoTemplate = async (template: Omit<VideoTemplate, 'id' | 'usageCount'>): Promise<VideoTemplate> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('video_templates')
    .insert({
      user_id: userData.user.id,
      name: template.name,
      description: template.description,
      category: template.category,
      duration: template.duration,
      placeholders: template.placeholders,
      style_config: template.styleConfig,
      is_public: template.isPublic
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    category: data.category,
    duration: data.duration,
    placeholders: data.placeholders,
    styleConfig: data.style_config,
    isPublic: data.is_public,
    usageCount: data.usage_count
  };
};

export const getTemplates = async (includePublic: boolean = true): Promise<VideoTemplate[]> => {
  const { data: userData } = await supabase.auth.getUser();

  let query = supabase.from('video_templates').select('*');

  if (userData.user) {
    if (includePublic) {
      query = query.or(`user_id.eq.${userData.user.id},is_public.eq.true`);
    } else {
      query = query.eq('user_id', userData.user.id);
    }
  } else {
    query = query.eq('is_public', true);
  }

  const { data, error } = await query.order('usage_count', { ascending: false });

  if (error) throw error;

  return data.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    duration: item.duration,
    placeholders: item.placeholders,
    styleConfig: item.style_config,
    isPublic: item.is_public,
    usageCount: item.usage_count
  }));
};

export const generateVideoFromTemplate = async (
  templateId: string,
  personalizationData: Record<string, string>
): Promise<string> => {
  return retryWithBackoff(async () => {
    try {
      const ai = await getGoogleGenAIInstance(false);

      // Get template
      const { data: template, error } = await supabase
        .from('video_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      // Increment usage count
      await supabase
        .from('video_templates')
        .update({ usage_count: template.usage_count + 1 })
        .eq('id', templateId);

      // Generate personalized script
      const scriptPrompt = `Create a video script for a ${template.category} video.
      Template: ${template.description}
      Duration: ${template.duration} seconds
      Personalization data: ${JSON.stringify(personalizationData)}

      Make it engaging, professional, and appropriate for the category.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: scriptPrompt }] }]
      });

      return response.text;
    } catch (error) {
      return handleGeminiError(error);
    }
  });
};

// ============================================
// 6. AI-POWERED VIDEO SEO OPTIMIZER
// ============================================

export interface VideoSEO {
  optimizedTitle: string;
  description: string;
  tags: string[];
  transcript: string;
  platformOptimizations: {
    linkedin: { caption: string; hashtags: string[] };
    youtube: { title: string; description: string };
    twitter: { tweet: string };
  };
  thumbnailSuggestions: Array<{ description: string; predictedCTR: number }>;
}

export const optimizeVideoForSEO = async (videoBlob: Blob, script: string, targetPlatform?: string): Promise<VideoSEO> => {
  return retryWithBackoff(async () => {
    try {
      const ai = await getGoogleGenAIInstance(false);
      const videoBase64 = await blobToDataURL(videoBlob);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [{
          parts: [
            {
              text: `Analyze this video and create comprehensive SEO optimization.

              Script: ${script}

              Generate:
              1. An optimized title (60 chars max, keyword-rich)
              2. A compelling description (160 chars)
              3. 10 relevant tags
              4. Full transcript for accessibility
              5. Platform-specific optimizations for LinkedIn, YouTube, Twitter
              6. 3 thumbnail concepts with predicted CTR (0-100)

              Return as JSON with keys: optimizedTitle, description, tags, transcript,
              platformOptimizations (object with linkedin, youtube, twitter),
              thumbnailSuggestions (array of {description, predictedCTR})`
            },
            { inlineData: { mimeType: videoBlob.type, data: videoBase64.split(',')[1] } }
          ]
        }],
        config: {
          responseMimeType: "application/json"
        }
      });

      return JSON.parse(response.text.trim());
    } catch (error) {
      return handleGeminiError(error);
    }
  });
};

export const saveVideoSEO = async (videoId: string, seo: VideoSEO): Promise<void> => {
  const { error } = await supabase
    .from('video_seo_metadata')
    .insert({
      video_id: videoId,
      optimized_title: seo.optimizedTitle,
      description: seo.description,
      tags: seo.tags,
      transcript: seo.transcript,
      platform_optimizations: seo.platformOptimizations,
      thumbnail_suggestions: seo.thumbnailSuggestions
    });

  if (error) throw error;
};

// ============================================
// 7. ENGAGEMENT PREDICTION & OPTIMIZATION
// ============================================

export interface EngagementPrediction {
  overallScore: number;
  dropOffPoints: Array<{ timestamp: number; likelihood: number; reason: string }>;
  recommendations: string[];
  optimalLength: number;
  predictedCompletionRate: number;
  strengths: string[];
  weaknesses: string[];
}

export const predictEngagement = async (videoBlob: Blob, transcript: string): Promise<EngagementPrediction> => {
  return retryWithBackoff(async () => {
    try {
      const ai = await getGoogleGenAIInstance(false);
      const videoBase64 = await blobToDataURL(videoBlob);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [{
          parts: [
            {
              text: `Analyze this video for viewer engagement potential.

              Transcript: ${transcript}

              Evaluate:
              1. Overall engagement score (0-100)
              2. Identify likely drop-off points with timestamps, likelihood (0-1), and reasons
              3. Provide 5-7 specific recommendations to improve engagement
              4. Suggest optimal video length in seconds
              5. Predict completion rate (0-1)
              6. List 3-5 strengths of the video
              7. List 3-5 weaknesses or areas for improvement

              Return as JSON with keys: overallScore, dropOffPoints (array),
              recommendations (array), optimalLength, predictedCompletionRate,
              strengths (array), weaknesses (array)`
            },
            { inlineData: { mimeType: videoBlob.type, data: videoBase64.split(',')[1] } }
          ]
        }],
        config: {
          responseMimeType: "application/json"
        }
      });

      return JSON.parse(response.text.trim());
    } catch (error) {
      return handleGeminiError(error);
    }
  });
};

export const saveEngagementPrediction = async (videoId: string, prediction: EngagementPrediction): Promise<void> => {
  const { error } = await supabase
    .from('engagement_predictions')
    .insert({
      video_id: videoId,
      overall_score: prediction.overallScore,
      drop_off_points: prediction.dropOffPoints,
      recommendations: prediction.recommendations,
      optimal_length: prediction.optimalLength,
      predicted_completion_rate: prediction.predictedCompletionRate
    });

  if (error) throw error;
};

// ============================================
// 8. MULTI-LANGUAGE VIDEO TRANSLATION
// ============================================

export interface VideoTranslation {
  id: string;
  languageCode: string;
  languageName: string;
  translatedScript: string;
  voiceoverUrl?: string;
  lipsyncVideoUrl?: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
}

export const translateVideo = async (
  videoId: string,
  originalScript: string,
  targetLanguage: string
): Promise<VideoTranslation> => {
  return retryWithBackoff(async () => {
    try {
      const ai = await getGoogleGenAIInstance(false);

      // Translate script
      const translationResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          parts: [{
            text: `Translate this video script to ${targetLanguage}.
            Maintain the tone, pacing, and emotional impact.
            Keep cultural context appropriate.

            Original script: ${originalScript}`
          }]
        }]
      });

      const translatedScript = translationResponse.text;

      // Save to database
      const { data, error } = await supabase
        .from('video_translations')
        .insert({
          original_video_id: videoId,
          language_code: targetLanguage,
          translated_script: translatedScript,
          status: 'complete'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        languageCode: data.language_code,
        languageName: targetLanguage,
        translatedScript: data.translated_script,
        voiceoverUrl: data.voiceover_url,
        lipsyncVideoUrl: data.lipsync_video_url,
        status: data.status
      };
    } catch (error) {
      return handleGeminiError(error);
    }
  });
};

export const getVideoTranslations = async (videoId: string): Promise<VideoTranslation[]> => {
  const { data, error } = await supabase
    .from('video_translations')
    .select('*')
    .eq('original_video_id', videoId);

  if (error) throw error;

  return data.map(item => ({
    id: item.id,
    languageCode: item.language_code,
    languageName: item.language_code,
    translatedScript: item.translated_script,
    voiceoverUrl: item.voiceover_url,
    lipsyncVideoUrl: item.lipsync_video_url,
    status: item.status
  }));
};

// ============================================
// 9. SMART VIDEO ANALYTICS DASHBOARD
// ============================================

export interface VideoAnalytics {
  videoId: string;
  views: number;
  uniqueViewers: number;
  avgWatchTime: number;
  completionRate: number;
  heatmap: Array<{ timestamp: number; viewerCount: number }>;
  dropOffPoints: Array<{ timestamp: number; dropOffRate: number }>;
  deviceBreakdown: Record<string, number>;
  locationBreakdown: Record<string, number>;
  aiInsights: string[];
  recommendations: string[];
}

export const getVideoAnalytics = async (videoId: string): Promise<VideoAnalytics> => {
  // Get raw analytics data
  const { data, error } = await supabase
    .from('video_analytics')
    .select('*')
    .eq('video_id', videoId);

  if (error) throw error;

  if (!data || data.length === 0) {
    return {
      videoId,
      views: 0,
      uniqueViewers: 0,
      avgWatchTime: 0,
      completionRate: 0,
      heatmap: [],
      dropOffPoints: [],
      deviceBreakdown: {},
      locationBreakdown: {},
      aiInsights: ['No viewing data available yet'],
      recommendations: ['Share your video to start collecting analytics']
    };
  }

  // Calculate metrics
  const views = data.length;
  const uniqueViewers = new Set(data.map(d => d.viewer_id)).size;
  const avgWatchTime = data.reduce((sum, d) => sum + d.watch_duration, 0) / views;
  const completionRate = data.reduce((sum, d) => sum + d.completion_rate, 0) / views;

  // Device breakdown
  const deviceBreakdown: Record<string, number> = {};
  data.forEach(d => {
    deviceBreakdown[d.device_type || 'unknown'] = (deviceBreakdown[d.device_type || 'unknown'] || 0) + 1;
  });

  // Location breakdown
  const locationBreakdown: Record<string, number> = {};
  data.forEach(d => {
    locationBreakdown[d.location || 'unknown'] = (locationBreakdown[d.location || 'unknown'] || 0) + 1;
  });

  // Generate AI insights
  const ai = await getGoogleGenAIInstance(false);
  const analyticsPrompt = `Analyze these video analytics and provide insights:

  Total Views: ${views}
  Unique Viewers: ${uniqueViewers}
  Average Watch Time: ${avgWatchTime.toFixed(0)} seconds
  Completion Rate: ${(completionRate * 100).toFixed(1)}%
  Device Breakdown: ${JSON.stringify(deviceBreakdown)}
  Location Breakdown: ${JSON.stringify(locationBreakdown)}

  Provide:
  1. 3-5 key insights about viewer behavior
  2. 3-5 actionable recommendations to improve performance

  Return as JSON with keys: insights (array of strings), recommendations (array of strings)`;

  const insightsResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ parts: [{ text: analyticsPrompt }] }],
    config: {
      responseMimeType: "application/json"
    }
  });

  const aiAnalysis = JSON.parse(insightsResponse.text);

  return {
    videoId,
    views,
    uniqueViewers,
    avgWatchTime,
    completionRate,
    heatmap: [],
    dropOffPoints: [],
    deviceBreakdown,
    locationBreakdown,
    aiInsights: aiAnalysis.insights,
    recommendations: aiAnalysis.recommendations
  };
};

export const trackVideoView = async (
  videoId: string,
  watchDuration: number,
  completionRate: number,
  droppedAt?: number
): Promise<void> => {
  const viewerId = `viewer_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const { error } = await supabase
    .from('video_analytics')
    .insert({
      video_id: videoId,
      viewer_id: viewerId,
      watch_duration: watchDuration,
      completion_rate: completionRate,
      dropped_at: droppedAt,
      device_type: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      location: 'unknown' // Could integrate geolocation API
    });

  if (error) console.error('Failed to track view:', error);
};

// ============================================
// 10. AI PRESENTATION COACH WITH LIVE FEEDBACK
// ============================================

export interface PresentationFeedback {
  timestamp: number;
  feedbackType: 'pace' | 'energy' | 'eye_contact' | 'posture' | 'gestures' | 'clarity';
  severity: 'good' | 'warning' | 'critical';
  suggestion: string;
}

export const analyzePresentationQuality = async (
  videoFrame: Blob,
  audioSegment: Blob,
  transcript: string
): Promise<PresentationFeedback[]> => {
  return retryWithBackoff(async () => {
    try {
      const ai = await getGoogleGenAIInstance(false);
      const frameBase64 = await blobToDataURL(videoFrame);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          parts: [
            {
              text: `Analyze this video frame and recent speech for presentation quality.

              Recent transcript: "${transcript}"

              Evaluate:
              1. Pace - Is speaking too fast or too slow?
              2. Energy - Does the speaker appear engaged and enthusiastic?
              3. Eye contact - Is the speaker looking at the camera?
              4. Posture - Is body language professional and confident?
              5. Clarity - Is speech clear and well-articulated?

              Return ONLY a JSON array of feedback objects with keys:
              feedbackType, severity (good/warning/critical), suggestion (specific advice)

              Only include feedback for areas that need improvement.`
            },
            { inlineData: { mimeType: 'image/jpeg', data: frameBase64.split(',')[1] } }
          ]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                feedbackType: { type: Type.STRING },
                severity: { type: Type.STRING },
                suggestion: { type: Type.STRING }
              }
            }
          }
        }
      });

      return JSON.parse(response.text.trim()).map((f: any) => ({
        timestamp: Date.now(),
        feedbackType: f.feedbackType,
        severity: f.severity,
        suggestion: f.suggestion
      }));
    } catch (error) {
      return handleGeminiError(error);
    }
  });
};

export const savePresentationFeedback = async (
  videoId: string,
  feedback: PresentationFeedback[]
): Promise<void> => {
  const feedbackRecords = feedback.map(f => ({
    video_id: videoId,
    timestamp: f.timestamp,
    feedback_type: f.feedbackType,
    severity: f.severity,
    suggestion: f.suggestion
  }));

  const { error } = await supabase
    .from('presentation_coach_feedback')
    .insert(feedbackRecords);

  if (error) throw error;
};

export const getPresentationFeedback = async (videoId: string): Promise<PresentationFeedback[]> => {
  const { data, error } = await supabase
    .from('presentation_coach_feedback')
    .select('*')
    .eq('video_id', videoId)
    .order('timestamp', { ascending: true });

  if (error) throw error;

  return data.map(item => ({
    timestamp: item.timestamp,
    feedbackType: item.feedback_type,
    severity: item.severity,
    suggestion: item.suggestion
  }));
};
