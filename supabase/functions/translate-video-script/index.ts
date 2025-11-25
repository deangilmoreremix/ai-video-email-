import { createClient } from 'npm:@supabase/supabase-js@2';
import { GoogleGenAI } from 'npm:@google/genai@1.25.0';

interface TranslationRequest {
  videoId: string;
  originalScript: string;
  targetLanguage: string;
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

    const requestData: TranslationRequest = await req.json();
    const { videoId, originalScript, targetLanguage } = requestData;

    if (!videoId || !originalScript || !targetLanguage) {
      throw new Error('Missing required fields: videoId, originalScript, targetLanguage');
    }

    // Initialize Gemini AI
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // Translate script
    const translationResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        parts: [{
          text: `Translate this video script to ${targetLanguage}. Maintain the tone, pacing, and emotional impact. Keep cultural context appropriate.\n\nOriginal script: ${originalScript}`
        }]
      }]
    });

    const translatedScript = translationResponse.text;

    // Save to database
    const { data, error: insertError } = await supabase
      .from('video_translations')
      .insert({
        original_video_id: videoId,
        language_code: targetLanguage,
        translated_script: translatedScript,
        status: 'complete'
      })
      .select()
      .single();

    if (insertError) throw insertError;

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
        translation: {
          id: data.id,
          languageCode: data.language_code,
          translatedScript: data.translated_script,
          status: data.status
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error translating video:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});