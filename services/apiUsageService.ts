import { supabase } from '../lib/supabase';

export interface APIUsageLog {
  id: string;
  user_id: string;
  api_provider: string;
  api_model: string;
  endpoint: string;
  request_type: string;
  tokens_used: number;
  status: 'success' | 'error' | 'rate_limited' | 'pending' | 'queued';
  error_message?: string;
  response_time_ms?: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface APIQuota {
  id: string;
  api_provider: string;
  api_model: string;
  quota_type: 'daily' | 'monthly' | 'per_minute' | 'per_hour';
  quota_limit: number;
  quota_used: number;
  reset_at: string;
  updated_at: string;
}

export interface APIRateLimit {
  id: string;
  api_provider: string;
  api_model: string;
  requests_per_minute: number;
  requests_per_day: number;
  requests_per_month: number;
  current_minute_count: number;
  current_day_count: number;
  current_month_count: number;
  minute_reset_at: string;
  day_reset_at: string;
  month_reset_at: string;
  is_enabled: boolean;
  updated_at: string;
}

export interface QueuedRequest {
  id: string;
  user_id: string;
  api_provider: string;
  api_model: string;
  request_data: Record<string, any>;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  retry_count: number;
  scheduled_for: string;
  processed_at?: string;
  result?: Record<string, any>;
  error_message?: string;
  created_at: string;
}

export const logAPIUsage = async (
  apiProvider: string,
  apiModel: string,
  endpoint: string,
  requestType: string,
  status: 'success' | 'error' | 'rate_limited',
  options: {
    tokensUsed?: number;
    errorMessage?: string;
    responseTimeMs?: number;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('api_usage_logs')
      .insert({
        user_id: user?.id,
        api_provider: apiProvider,
        api_model: apiModel,
        endpoint,
        request_type: requestType,
        tokens_used: options.tokensUsed || 0,
        status,
        error_message: options.errorMessage,
        response_time_ms: options.responseTimeMs,
        metadata: options.metadata || {}
      });

    if (error) {
      console.error('Failed to log API usage:', error);
    }
  } catch (error) {
    console.error('Error logging API usage:', error);
  }
};

export const canMakeAPIRequest = async (
  apiProvider: string,
  apiModel: string
): Promise<{ allowed: boolean; reason?: string; retryAfter?: number }> => {
  try {
    const { data, error } = await supabase
      .rpc('can_make_api_request', {
        p_api_provider: apiProvider,
        p_api_model: apiModel
      });

    if (error) {
      console.error('Error checking API rate limits:', error);
      return { allowed: true };
    }

    if (!data) {
      const limits = await getRateLimit(apiProvider, apiModel);
      if (!limits) {
        return { allowed: true };
      }

      if (limits.current_minute_count >= limits.requests_per_minute) {
        const resetTime = new Date(limits.minute_reset_at).getTime();
        const now = Date.now();
        const retryAfter = Math.ceil((resetTime - now) / 1000);
        return {
          allowed: false,
          reason: 'Per-minute rate limit exceeded',
          retryAfter
        };
      }

      if (limits.current_day_count >= limits.requests_per_day) {
        const resetTime = new Date(limits.day_reset_at).getTime();
        const now = Date.now();
        const retryAfter = Math.ceil((resetTime - now) / 1000);
        return {
          allowed: false,
          reason: 'Daily rate limit exceeded',
          retryAfter
        };
      }

      if (limits.current_month_count >= limits.requests_per_month) {
        const resetTime = new Date(limits.month_reset_at).getTime();
        const now = Date.now();
        const retryAfter = Math.ceil((resetTime - now) / 1000);
        return {
          allowed: false,
          reason: 'Monthly rate limit exceeded',
          retryAfter
        };
      }
    }

    return { allowed: data };
  } catch (error) {
    console.error('Error checking API request permission:', error);
    return { allowed: true };
  }
};

export const incrementAPICounter = async (
  apiProvider: string,
  apiModel: string
): Promise<void> => {
  try {
    const { error } = await supabase.rpc('increment_api_counter', {
      p_api_provider: apiProvider,
      p_api_model: apiModel
    });

    if (error) {
      console.error('Failed to increment API counter:', error);
    }
  } catch (error) {
    console.error('Error incrementing API counter:', error);
  }
};

export const queueAPIRequest = async (
  apiProvider: string,
  apiModel: string,
  requestData: Record<string, any>,
  priority: number = 5
): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('api_request_queue')
      .insert({
        user_id: user.id,
        api_provider: apiProvider,
        api_model: apiModel,
        request_data: requestData,
        priority,
        status: 'pending',
        scheduled_for: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return data.id;
  } catch (error) {
    console.error('Error queuing API request:', error);
    return null;
  }
};

export const getQueuedRequest = async (requestId: string): Promise<QueuedRequest | null> => {
  try {
    const { data, error } = await supabase
      .from('api_request_queue')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching queued request:', error);
    return null;
  }
};

export const getUserQueuedRequests = async (): Promise<QueuedRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('api_request_queue')
      .select('*')
      .in('status', ['pending', 'processing'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user queued requests:', error);
    return [];
  }
};

export const getRateLimit = async (
  apiProvider: string,
  apiModel: string
): Promise<APIRateLimit | null> => {
  try {
    const { data, error } = await supabase
      .from('api_rate_limits')
      .select('*')
      .eq('api_provider', apiProvider)
      .eq('api_model', apiModel)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching rate limit:', error);
    return null;
  }
};

export const getAllRateLimits = async (): Promise<APIRateLimit[]> => {
  try {
    const { data, error } = await supabase
      .from('api_rate_limits')
      .select('*')
      .order('api_provider', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching rate limits:', error);
    return [];
  }
};

export const getAPIQuotas = async (): Promise<APIQuota[]> => {
  try {
    const { data, error } = await supabase
      .from('api_quotas')
      .select('*')
      .order('api_provider', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching API quotas:', error);
    return [];
  }
};

export const getAPIUsageLogs = async (
  limit: number = 100,
  offset: number = 0
): Promise<APIUsageLog[]> => {
  try {
    const { data, error } = await supabase
      .from('api_usage_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching API usage logs:', error);
    return [];
  }
};

export const getAPIUsageStats = async (): Promise<{
  total_requests: number;
  success_count: number;
  error_count: number;
  rate_limited_count: number;
  total_tokens: number;
  avg_response_time: number;
}> => {
  try {
    const { data, error } = await supabase
      .from('api_usage_logs')
      .select('status, tokens_used, response_time_ms');

    if (error) throw error;

    const stats = {
      total_requests: data?.length || 0,
      success_count: data?.filter(l => l.status === 'success').length || 0,
      error_count: data?.filter(l => l.status === 'error').length || 0,
      rate_limited_count: data?.filter(l => l.status === 'rate_limited').length || 0,
      total_tokens: data?.reduce((sum, l) => sum + (l.tokens_used || 0), 0) || 0,
      avg_response_time: data?.length
        ? Math.round(data.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / data.length)
        : 0
    };

    return stats;
  } catch (error) {
    console.error('Error fetching API usage stats:', error);
    return {
      total_requests: 0,
      success_count: 0,
      error_count: 0,
      rate_limited_count: 0,
      total_tokens: 0,
      avg_response_time: 0
    };
  }
};

export const updateRateLimit = async (
  apiProvider: string,
  apiModel: string,
  updates: Partial<APIRateLimit>
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('api_rate_limits')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('api_provider', apiProvider)
      .eq('api_model', apiModel);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating rate limit:', error);
    throw error;
  }
};
