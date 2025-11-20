import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserSettings {
  id: string;
  user_id: string;
  email_api_provider: 'mailto' | 'sendgrid' | 'resend' | 'mailgun' | 'smtp';
  email_api_key?: string;
  email_from_address?: string;
  email_from_name?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  zapier_webhook_url?: string;
  zapier_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserVideo {
  id: string;
  user_id: string;
  video_name: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  file_size?: number;
  script?: string;
  transcript?: string;
  ai_scenes: string[];
  created_at: string;
  updated_at: string;
}
