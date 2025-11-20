import { supabase } from '../lib/supabase';

export interface CollaborationSession {
  id: string;
  video_id: string;
  session_code: string;
  owner_id: string;
  active_collaborators: string[];
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

export interface CollaborationFeedback {
  id: string;
  session_id: string;
  user_id: string;
  timestamp: number;
  comment: string;
  type: 'suggestion' | 'question' | 'approval';
  resolved: boolean;
  created_at: string;
}

function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createCollaborationSession(
  videoId: string
): Promise<CollaborationSession | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const sessionCode = generateSessionCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data, error } = await supabase
      .from('collaboration_sessions')
      .insert([{
        video_id: videoId,
        owner_id: user.id,
        session_code: sessionCode,
        active_collaborators: [],
        is_active: true,
        expires_at: expiresAt.toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating collaboration session:', error);
    return null;
  }
}

export async function getCollaborationSession(
  sessionCode: string
): Promise<CollaborationSession | null> {
  try {
    const { data, error } = await supabase
      .from('collaboration_sessions')
      .select('*')
      .eq('session_code', sessionCode)
      .eq('is_active', true)
      .single();

    if (error) throw error;

    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      await supabase
        .from('collaboration_sessions')
        .update({ is_active: false })
        .eq('id', data.id);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching collaboration session:', error);
    return null;
  }
}

export async function addFeedback(
  sessionId: string,
  timestamp: number,
  comment: string,
  type: 'suggestion' | 'question' | 'approval'
): Promise<CollaborationFeedback | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('collaboration_feedback')
      .insert([{
        session_id: sessionId,
        user_id: user.id,
        timestamp,
        comment,
        type,
        resolved: false
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding feedback:', error);
    return null;
  }
}

export async function getFeedback(
  sessionId: string
): Promise<CollaborationFeedback[]> {
  try {
    const { data, error } = await supabase
      .from('collaboration_feedback')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return [];
  }
}

export async function resolveFeedback(feedbackId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('collaboration_feedback')
      .update({ resolved: true })
      .eq('id', feedbackId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error resolving feedback:', error);
    return false;
  }
}

export async function getActiveSessionsForUser(): Promise<CollaborationSession[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('collaboration_sessions')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    return [];
  }
}
