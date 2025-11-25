import { createClient } from 'npm:@supabase/supabase-js@2';
import { GoogleGenAI } from 'npm:@google/genai@1.25.0';

interface SEORequest {
  videoId: string;
  videoBase64: string;
  script: string;
  targetPlatform?: string;
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

    const requestData: SEORequest = await req.json();
    const { videoId, videoBase64, script } = requestData;

    if (!videoId || !videoBase64 || !script) {
      throw new Error('Missing required fields: videoId, videoBase64, script');
    }

    // Initialize Gemini AI
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [{
        parts: [
          {
            text: `Analyze this video and create comprehensive SEO optimization.\n\nScript: ${script}\n\nGenerate:\n1. An optimized title (60 chars max, keyword-rich)\n2. A compelling description (160 chars)\n3. 10 relevant tags\n4. Full transcript for accessibility\n5. Platform-specific optimizations for LinkedIn, YouTube, Twitter\n6. 3 thumbnail concepts with predicted CTR (0-100)\n\nReturn as JSON with keys: optimizedTitle, description, tags, transcript, platformOptimizations (object with linkedin, youtube, twitter), thumbnailSuggestions (array of {description, predictedCTR})`
          },
          { inlineData: { mimeType: 'video/webm', data: videoBase64 } }
        ]
      }],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const seoData = JSON.parse(response.text.trim());

    // Save to database
    const { error: insertError } = await supabase
      .from('video_seo_metadata')
      .insert({
        video_id: videoId,
        optimized_title: seoData.optimizedTitle,
        description: seoData.description,
        tags: seoData.tags,
        transcript: seoData.transcript,
        platform_optimizations: seoData.platformOptimizations,
        thumbnail_suggestions: seoData.thumbnailSuggestions
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
        seoData
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error optimizing video SEO:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});