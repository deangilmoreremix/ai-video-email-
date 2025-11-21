import { supabase } from '../lib/supabase';

export interface PromptHistory {
  id: string;
  user_id: string;
  original_prompt: string;
  improved_prompt: string | null;
  generated_script: string | null;
  category: string | null;
  context: Record<string, any>;
  quality_score: number | null;
  engagement_score: number | null;
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface SavedPrompt {
  id: string;
  user_id: string;
  title: string;
  prompt_text: string;
  category: string | null;
  tags: string[];
  context: Record<string, any>;
  is_public: boolean;
  usage_count: number;
  avg_quality_score: number | null;
  created_at: string;
  updated_at: string;
}

export const savePromptToHistory = async (data: {
  original_prompt: string;
  improved_prompt?: string;
  generated_script?: string;
  category?: string;
  context?: Record<string, any>;
  quality_score?: number;
}): Promise<PromptHistory | null> => {
  try {
    const { data: result, error } = await supabase
      .from('prompt_history')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error saving prompt to history:', error);
    return null;
  }
};

export const getPromptHistory = async (
  limit: number = 20,
  category?: string
): Promise<PromptHistory[]> => {
  try {
    let query = supabase
      .from('prompt_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching prompt history:', error);
    return [];
  }
};

export const getFavoritePrompts = async (): Promise<PromptHistory[]> => {
  try {
    const { data, error } = await supabase
      .from('prompt_history')
      .select('*')
      .eq('is_favorite', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching favorite prompts:', error);
    return [];
  }
};

export const toggleFavoritePrompt = async (
  id: string,
  is_favorite: boolean
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('prompt_history')
      .update({ is_favorite })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return false;
  }
};

export const updatePromptEngagementScore = async (
  id: string,
  engagement_score: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('prompt_history')
      .update({ engagement_score })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating engagement score:', error);
    return false;
  }
};

export const saveSavedPrompt = async (data: {
  title: string;
  prompt_text: string;
  category?: string;
  tags?: string[];
  context?: Record<string, any>;
  is_public?: boolean;
}): Promise<SavedPrompt | null> => {
  try {
    const { data: result, error } = await supabase
      .from('saved_prompts')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error saving prompt:', error);
    return null;
  }
};

export const getSavedPrompts = async (
  category?: string,
  includePublic: boolean = false
): Promise<SavedPrompt[]> => {
  try {
    let query = supabase
      .from('saved_prompts')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching saved prompts:', error);
    return [];
  }
};

export const getPublicPrompts = async (category?: string): Promise<SavedPrompt[]> => {
  try {
    let query = supabase
      .from('saved_prompts')
      .select('*')
      .eq('is_public', true)
      .order('usage_count', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching public prompts:', error);
      throw error;
    }

    console.log('Public prompts fetched:', data?.length || 0, 'prompts', category ? `(category: ${category})` : '(all categories)');
    return data || [];
  } catch (error) {
    console.error('Error fetching public prompts:', error);
    return [];
  }
};

export const incrementSavedPromptUsage = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.rpc('increment_prompt_usage', {
      prompt_id: id
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error incrementing prompt usage:', error);
    return false;
  }
};

export const deleteSavedPrompt = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('saved_prompts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return false;
  }
};

export const deletePromptHistoryItem = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('prompt_history')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting prompt history:', error);
    return false;
  }
};

export const searchPrompts = async (searchTerm: string): Promise<SavedPrompt[]> => {
  try {
    const { data, error } = await supabase
      .from('saved_prompts')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,prompt_text.ilike.%${searchTerm}%`)
      .order('usage_count', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching prompts:', error);
    return [];
  }
};
