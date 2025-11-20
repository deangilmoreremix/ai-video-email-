/*
  # User Settings and Video Storage Schema

  1. New Tables
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `email_api_provider` (text) - e.g., 'sendgrid', 'resend', 'mailgun', 'smtp'
      - `email_api_key` (text, encrypted) - API key for email provider
      - `email_from_address` (text) - From email address
      - `email_from_name` (text) - From name
      - `smtp_host` (text) - SMTP host (for custom SMTP)
      - `smtp_port` (integer) - SMTP port
      - `smtp_username` (text) - SMTP username
      - `smtp_password` (text, encrypted) - SMTP password
      - `zapier_webhook_url` (text) - Zapier webhook URL
      - `zapier_enabled` (boolean) - Whether Zapier integration is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `user_videos`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `video_name` (text) - Name/title of the video
      - `video_url` (text) - Storage URL for the video
      - `thumbnail_url` (text) - Thumbnail image URL
      - `duration` (integer) - Duration in seconds
      - `file_size` (bigint) - File size in bytes
      - `script` (text) - Associated script
      - `transcript` (text) - Video transcript
      - `ai_scenes` (jsonb) - Array of AI-generated scene URLs
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Storage
    - Create storage bucket for video files
    - Create storage bucket for thumbnails

  3. Security
    - Enable RLS on both tables
    - Users can only access their own settings and videos
    - Storage policies for authenticated users only

  4. Important Notes
    - Video limit of 10 per user enforced at application level
    - Sensitive API keys should be encrypted (application handles encryption)
    - Zapier webhooks are called on video creation/email send events
*/

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_api_provider text DEFAULT 'mailto',
  email_api_key text,
  email_from_address text,
  email_from_name text,
  smtp_host text,
  smtp_port integer,
  smtp_username text,
  smtp_password text,
  zapier_webhook_url text,
  zapier_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_videos table
CREATE TABLE IF NOT EXISTS user_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_name text NOT NULL,
  video_url text NOT NULL,
  thumbnail_url text,
  duration integer,
  file_size bigint,
  script text,
  transcript text,
  ai_scenes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_user_videos_user_id ON user_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_videos_created_at ON user_videos(created_at DESC);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_videos
CREATE POLICY "Users can view own videos"
  ON user_videos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own videos"
  ON user_videos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos"
  ON user_videos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own videos"
  ON user_videos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for videos bucket
CREATE POLICY "Users can upload own videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for thumbnails bucket
CREATE POLICY "Users can upload own thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own thumbnails"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own thumbnails"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_videos_updated_at BEFORE UPDATE ON user_videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();