/*
  # Add Workflow Features Schema

  1. New Tables
    - `template_scripts` - Store script content for templates
      - `id` (uuid, primary key)
      - `template_id` (uuid, foreign key to video_templates)
      - `script_content` (text)
      - `created_at` (timestamp)
    
    - `video_progress` - Track user progress through optimization checklist
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `video_id` (uuid, foreign key to user_videos, nullable)
      - `script_written` (boolean)
      - `video_recorded` (boolean)
      - `presentation_scored` (boolean)
      - `chapters_generated` (boolean)
      - `seo_optimized` (boolean)
      - `team_approval` (boolean)
      - `engagement_predicted` (boolean)
      - `completion_percentage` (integer)
      - `updated_at` (timestamp)
    
    - `user_onboarding` - Track progressive feature disclosure
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users, unique)
      - `videos_created` (integer)
      - `videos_sent` (integer)
      - `features_unlocked` (jsonb array)
      - `current_session` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
*/

-- Create template_scripts table
CREATE TABLE IF NOT EXISTS template_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES video_templates(id) ON DELETE CASCADE,
  script_content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE template_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public template scripts"
  ON template_scripts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM video_templates vt
      WHERE vt.id = template_scripts.template_id
      AND (vt.is_public = true OR vt.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage own template scripts"
  ON template_scripts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM video_templates vt
      WHERE vt.id = template_scripts.template_id
      AND vt.user_id = auth.uid()
    )
  );

-- Create video_progress table
CREATE TABLE IF NOT EXISTS video_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_id uuid REFERENCES user_videos(id) ON DELETE CASCADE,
  script_written boolean DEFAULT false,
  video_recorded boolean DEFAULT false,
  presentation_scored boolean DEFAULT false,
  chapters_generated boolean DEFAULT false,
  seo_optimized boolean DEFAULT false,
  team_approval boolean DEFAULT false,
  engagement_predicted boolean DEFAULT false,
  completion_percentage integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON video_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own progress"
  ON video_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON video_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create user_onboarding table
CREATE TABLE IF NOT EXISTS user_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  videos_created integer DEFAULT 0,
  videos_sent integer DEFAULT 0,
  features_unlocked jsonb DEFAULT '[]'::jsonb,
  current_session integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding"
  ON user_onboarding FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own onboarding"
  ON user_onboarding FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding"
  ON user_onboarding FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add missing script_template column to video_templates if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_templates' AND column_name = 'script_template'
  ) THEN
    ALTER TABLE video_templates ADD COLUMN script_template text;
  END IF;
END $$;