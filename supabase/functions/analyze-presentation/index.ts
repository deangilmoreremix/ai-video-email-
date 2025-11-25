import { createClient } from 'npm:@supabase/supabase-js@2';
import { GoogleGenAI, Type } from 'npm:@google/genai@1.25.0';

interface PresentationRequest {
  videoId?: string;
  frameBase64: string;
  transcript: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const requestData: PresentationRequest = await req.json();
    const { videoId, frameBase64, transcript } = requestData;

    if (!frameBase64 || !transcript) {
      throw new Error('Missing required fields: frameBase64, transcript');
    }

    // Initialize Gemini AI
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        parts: [
          {
            text: `Analyze this video frame and recent speech for presentation quality.\n\nRecent transcript: "${transcript}"\n\nEvaluate:\n1. Pace - Is speaking too fast or too slow?\n2. Energy - Does the speaker appear engaged and enthusiastic?\n3. Eye contact - Is the speaker looking at the camera?\n4. Posture - Is body language professional and confident?\n5. Clarity - Is speech clear and well-articulated?\n\nReturn ONLY a JSON array of feedback objects with keys: feedbackType, severity (good/warning/critical), suggestion (specific advice)\n\nOnly include feedback for areas that need improvement.`
          },
          { inlineData: { mimeType: 'image/jpeg', data: frameBase64 } }
        ]
      }],
      config: {
        responseMimeType: 'application/json',
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

    const feedback = JSON.parse(response.text.trim()).map((f: any) => ({
      timestamp: Date.now(),
      feedbackType: f.feedbackType,
      severity: f.severity,
      suggestion: f.suggestion
    }));

    // Save to database if videoId provided
    if (videoId && feedback.length > 0) {
      const feedbackRecords = feedback.map((f: any) => ({
        video_id: videoId,
        timestamp: f.timestamp,
        feedback_type: f.feedbackType,
        severity: f.severity,
        suggestion: f.suggestion
      }));

      await supabase
        .from('presentation_coach_feedback')
        .insert(feedbackRecords);
    }

    // Track API usage
    await supabase
      .from('api_usage_logs')
      .insert({
        user_id: user.id,
        provider: 'gemini',
        model_used: 'gemini-2.5-flash',
        tokens_used: 0,
        cost: 0,
        status: 'success'
      });

    return new Response(
      JSON.stringify({
        success: true,
        feedback
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error analyzing presentation:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});