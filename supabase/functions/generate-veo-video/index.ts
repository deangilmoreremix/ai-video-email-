import { createClient } from 'npm:@supabase/supabase-js@2';
import { GoogleGenAI } from 'npm:@google/genai@1.25.0';

interface VeoRequest {
  prompt: string;
  duration: number;
  style: 'modern-tech' | 'cinematic' | 'abstract' | 'professional';
  aspectRatio?: '16:9' | '9:16' | '1:1';
  model?: 'veo-2' | 'veo-2-flash' | 'veo-2-gemini' | 'veo-003';
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const stylePrompts = {
  'modern-tech': 'sleek modern technology visualization with clean lines and glowing elements',
  'cinematic': 'cinematic professional footage with dramatic lighting and depth',
  'abstract': 'abstract artistic visualization with flowing shapes and colors',
  'professional': 'professional business environment with clean aesthetic'
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

    const requestData: VeoRequest = await req.json();
    const { prompt, duration, style, aspectRatio = '16:9', model = 'veo-2' } = requestData;

    if (!prompt || !duration || !style) {
      throw new Error('Missing required fields: prompt, duration, style');
    }

    const fullPrompt = `${stylePrompts[style]}. ${prompt}`;

    // Insert pending record
    const { data: bgRecord, error: insertError } = await supabase
      .from('veo_generated_backgrounds')
      .insert({
        user_id: user.id,
        prompt: fullPrompt,
        duration,
        style,
        veo_model: model,
        status: 'processing'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Initialize Gemini AI
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // Call Veo API for video generation
    const response = await ai.models.generateContent({
      model,
      contents: [{
        parts: [{ text: fullPrompt }]
      }],
      config: {
        videoGeneration: {
          duration,
          aspectRatio
        }
      }
    });

    // Extract video URL from response
    const videoUrl = response.candidates?.[0]?.content?.parts?.[0]?.videoUrl || '';

    if (!videoUrl) {
      await supabase
        .from('veo_generated_backgrounds')
        .update({ status: 'failed' })
        .eq('id', bgRecord.id);
      
      throw new Error(`${model} did not return a video URL. The model may not be available.`);
    }

    // Update record with video URL
    await supabase
      .from('veo_generated_backgrounds')
      .update({ video_url: videoUrl, status: 'complete' })
      .eq('id', bgRecord.id);

    // Track API usage
    await supabase
      .from('api_usage_logs')
      .insert({
        user_id: user.id,
        provider: 'gemini',
        model_used: model,
        tokens_used: 0,
        cost: 0,
        status: 'success'
      });

    return new Response(
      JSON.stringify({
        success: true,
        id: bgRecord.id,
        videoUrl,
        status: 'complete'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error generating VEO video:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});