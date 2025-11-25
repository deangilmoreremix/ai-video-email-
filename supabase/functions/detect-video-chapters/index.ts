import { createClient } from 'npm:@supabase/supabase-js@2';
import { GoogleGenAI, Type } from 'npm:@google/genai@1.25.0';

interface ChapterRequest {
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

    const requestData: ChapterRequest = await req.json();
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
            text: `Analyze this video and identify natural topic boundaries to create chapters. For each chapter provide: - A descriptive title (3-8 words) - Start and end timestamps in seconds - A brief summary (1-2 sentences)\n\nReturn ONLY a JSON array of chapter objects with keys: title, startTime, endTime, summary.\n\nTranscript: ${transcript}`
          },
          { inlineData: { mimeType: 'video/webm', data: videoBase64 } }
        ]
      }],
      config: {
        responseMimeType: 'application/json',
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

    // Save to database
    const chaptersToInsert = chapters.map((chapter: any) => ({
      video_id: videoId,
      title: chapter.title,
      start_time: chapter.startTime,
      end_time: chapter.endTime,
      summary: chapter.summary
    }));

    const { error: insertError } = await supabase
      .from('video_chapters')
      .insert(chaptersToInsert);

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
        chapters
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error detecting chapters:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});