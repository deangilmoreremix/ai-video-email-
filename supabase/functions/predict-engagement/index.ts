import { createClient } from 'npm:@supabase/supabase-js@2';
import { GoogleGenAI } from 'npm:@google/genai@1.25.0';

interface EngagementRequest {
  videoId: string;
  videoBase64: string;
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

    const requestData: EngagementRequest = await req.json();
    const { videoId, videoBase64, transcript } = requestData;

    if (!videoId || !videoBase64 || !transcript) {
      throw new Error('Missing required fields: videoId, videoBase64, transcript');
    }

    // Initialize Gemini AI
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [{
        parts: [
          {
            text: `Analyze this video for viewer engagement potential.\n\nTranscript: ${transcript}\n\nEvaluate:\n1. Overall engagement score (0-100)\n2. Identify likely drop-off points with timestamps, likelihood (0-1), and reasons\n3. Provide 5-7 specific recommendations to improve engagement\n4. Suggest optimal video length in seconds\n5. Predict completion rate (0-1)\n6. List 3-5 strengths of the video\n7. List 3-5 weaknesses or areas for improvement\n\nReturn as JSON with keys: overallScore, dropOffPoints (array), recommendations (array), optimalLength, predictedCompletionRate, strengths (array), weaknesses (array)`
          },
          { inlineData: { mimeType: 'video/webm', data: videoBase64 } }
        ]
      }],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const prediction = JSON.parse(response.text.trim());

    // Save to database
    const { error: insertError } = await supabase
      .from('engagement_predictions')
      .insert({
        video_id: videoId,
        overall_score: prediction.overallScore,
        drop_off_points: prediction.dropOffPoints,
        recommendations: prediction.recommendations,
        optimal_length: prediction.optimalLength,
        predicted_completion_rate: prediction.predictedCompletionRate
      });

    if (insertError) throw insertError;

    // Track API usage
    await supabase
      .from('api_usage_logs')
      .insert({
        user_id: user.id,
        provider: 'gemini',
        model_used: 'gemini-2.5-pro',
        tokens_used: 0,
        cost: 0,
        status: 'success'
      });

    return new Response(
      JSON.stringify({
        success: true,
        prediction
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error predicting engagement:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});