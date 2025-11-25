import { createClient } from 'npm:@supabase/supabase-js@2';
import { GoogleGenAI } from 'npm:@google/genai@1.25.0';

interface VoiceCloneRequest {
  audioBase64: string;
  targetText: string;
  language?: string;
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

    const requestData: VoiceCloneRequest = await req.json();
    const { audioBase64, targetText, language = 'en-US' } = requestData;

    if (!audioBase64 || !targetText) {
      throw new Error('Missing required fields: audioBase64, targetText');
    }

    // Initialize Gemini AI
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // Analyze voice characteristics
    const voiceAnalysis = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [{
        parts: [
          { text: 'Analyze this voice sample and describe its characteristics: pitch, tone, pace, accent, and speaking style. Be detailed and specific.' },
          { inlineData: { mimeType: 'audio/webm', data: audioBase64 } }
        ]
      }]
    });

    const voiceProfile = voiceAnalysis.text;

    // Store voice profile
    await supabase
      .from('voice_profiles')
      .upsert({
        user_id: user.id,
        voice_characteristics: voiceProfile,
        language,
        created_at: new Date().toISOString()
      });

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
        voiceProfile,
        duration: Math.ceil(targetText.length / 15)
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error analyzing voice:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});