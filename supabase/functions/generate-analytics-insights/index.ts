import { createClient } from 'npm:@supabase/supabase-js@2';
import { GoogleGenAI } from 'npm:@google/genai@1.25.0';

interface AnalyticsRequest {
  videoId: string;
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

    const requestData: AnalyticsRequest = await req.json();
    const { videoId } = requestData;

    if (!videoId) {
      throw new Error('Missing required field: videoId');
    }

    // Get raw analytics data
    const { data, error } = await supabase
      .from('video_analytics')
      .select('*')
      .eq('video_id', videoId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          analytics: {
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
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate metrics
    const views = data.length;
    const uniqueViewers = new Set(data.map(d => d.viewer_id)).size;
    const avgWatchTime = data.reduce((sum: number, d: any) => sum + d.watch_duration, 0) / views;
    const completionRate = data.reduce((sum: number, d: any) => sum + d.completion_rate, 0) / views;

    // Device breakdown
    const deviceBreakdown: Record<string, number> = {};
    data.forEach((d: any) => {
      deviceBreakdown[d.device_type || 'unknown'] = (deviceBreakdown[d.device_type || 'unknown'] || 0) + 1;
    });

    // Location breakdown
    const locationBreakdown: Record<string, number> = {};
    data.forEach((d: any) => {
      locationBreakdown[d.location || 'unknown'] = (locationBreakdown[d.location || 'unknown'] || 0) + 1;
    });

    // Generate AI insights
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const analyticsPrompt = `Analyze these video analytics and provide insights:\n\nTotal Views: ${views}\nUnique Viewers: ${uniqueViewers}\nAverage Watch Time: ${avgWatchTime.toFixed(0)} seconds\nCompletion Rate: ${(completionRate * 100).toFixed(1)}%\nDevice Breakdown: ${JSON.stringify(deviceBreakdown)}\nLocation Breakdown: ${JSON.stringify(locationBreakdown)}\n\nProvide:\n1. 3-5 key insights about viewer behavior\n2. 3-5 actionable recommendations to improve performance\n\nReturn as JSON with keys: insights (array of strings), recommendations (array of strings)`;

    const insightsResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: analyticsPrompt }] }],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const aiAnalysis = JSON.parse(insightsResponse.text);

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
        analytics: {
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
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error generating analytics insights:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});