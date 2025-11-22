/*
  # Add Contacts System and Enhanced Features

  1. New Tables
    - `contacts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `email` (text, required)
      - `first_name` (text)
      - `last_name` (text)
      - `company` (text)
      - `phone` (text)
      - `tags` (text array)
      - `custom_fields` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `video_analytics_enhanced`
      - `id` (uuid, primary key)
      - `video_id` (uuid, foreign key)
      - `emotion_data` (jsonb) - Stores emotion detection results
      - `engagement_score` (numeric) - Overall engagement score
      - `text_extracted` (text) - OCR extracted text
      - `chapters` (jsonb) - Auto-detected chapters
      - `created_at` (timestamptz)

    - `keyboard_shortcuts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `shortcut_key` (text)
      - `action` (text)
      - `is_enabled` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
    - Add policies for video analytics access

  3. Indexes
    - Add indexes for email lookups in contacts
    - Add indexes for video analytics queries
*/

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  first_name text DEFAULT '',
  last_name text DEFAULT '',
  company text DEFAULT '',
  phone text DEFAULT '',
  tags text[] DEFAULT '{}',
  custom_fields jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING gin(tags);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policies for contacts
CREATE POLICY "Users can view own contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
  ON contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
  ON contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create enhanced video analytics table
CREATE TABLE IF NOT EXISTS video_analytics_enhanced (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES user_videos(id) ON DELETE CASCADE NOT NULL,
  emotion_data jsonb DEFAULT '{}',
  engagement_score numeric DEFAULT 0,
  text_extracted text DEFAULT '',
  chapters jsonb DEFAULT '[]',
  background_removed boolean DEFAULT false,
  noise_cancelled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for video analytics
CREATE INDEX IF NOT EXISTS idx_video_analytics_enhanced_video_id ON video_analytics_enhanced(video_id);

-- Enable RLS
ALTER TABLE video_analytics_enhanced ENABLE ROW LEVEL SECURITY;

-- Policies for video analytics
CREATE POLICY "Users can view analytics for own videos"
  ON video_analytics_enhanced FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_videos
      WHERE user_videos.id = video_analytics_enhanced.video_id
      AND user_videos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert analytics for own videos"
  ON video_analytics_enhanced FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_videos
      WHERE user_videos.id = video_analytics_enhanced.video_id
      AND user_videos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update analytics for own videos"
  ON video_analytics_enhanced FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_videos
      WHERE user_videos.id = video_analytics_enhanced.video_id
      AND user_videos.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_videos
      WHERE user_videos.id = video_analytics_enhanced.video_id
      AND user_videos.user_id = auth.uid()
    )
  );

-- Create keyboard shortcuts table
CREATE TABLE IF NOT EXISTS keyboard_shortcuts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shortcut_key text NOT NULL,
  action text NOT NULL,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_keyboard_shortcuts_user_id ON keyboard_shortcuts(user_id);

-- Enable RLS
ALTER TABLE keyboard_shortcuts ENABLE ROW LEVEL SECURITY;

-- Policies for keyboard shortcuts
CREATE POLICY "Users can view own shortcuts"
  ON keyboard_shortcuts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shortcuts"
  ON keyboard_shortcuts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shortcuts"
  ON keyboard_shortcuts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shortcuts"
  ON keyboard_shortcuts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_video_analytics_enhanced_updated_at ON video_analytics_enhanced;
CREATE TRIGGER update_video_analytics_enhanced_updated_at
  BEFORE UPDATE ON video_analytics_enhanced
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
