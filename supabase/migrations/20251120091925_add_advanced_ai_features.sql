/*
  # Advanced AI Features Schema

  ## Overview
  This migration adds comprehensive support for 10 advanced AI features including:
  video chapters, templates, analytics, collaboration, SEO optimization, and more.

  ## New Tables

  ### 1. video_chapters
  Stores AI-generated chapter information for videos
  
  ### 2. video_templates
  Stores reusable video templates
  
  ### 3. video_analytics
  Tracks video viewing metrics
  
  ### 4. video_translations
  Stores translated versions of videos
  
  ### 5. video_seo_metadata
  Stores SEO optimization data
  
  ### 6. engagement_predictions
  Stores AI predictions for video engagement
  
  ### 7. collaboration_sessions
  Manages real-time collaboration
  
  ### 8. collaboration_feedback
  Stores timestamped feedback comments
  
  ### 9. presentation_coach_feedback
  Stores AI coaching insights
  
  ### 10. veo_generated_backgrounds
  Tracks Veo-generated B-roll videos

  ## Security
  All tables have RLS enabled with appropriate policies for authenticated users.
*/

-- Create video_chapters table
CREATE TABLE IF NOT EXISTS video_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES user_videos(id) ON DELETE CASCADE,
  title text NOT NULL,
  start_time float NOT NULL,
  end_time float NOT NULL,
  summary text,
  thumbnail_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE video_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chapters of their videos"
  ON video_chapters FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_videos
      WHERE user_videos.id = video_chapters.video_id
      AND user_videos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chapters for their videos"
  ON video_chapters FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_videos
      WHERE user_videos.id = video_chapters.video_id
      AND user_videos.user_id = auth.uid()
    )
  );

-- Create video_templates table
CREATE TABLE IF NOT EXISTS video_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  duration integer,
  placeholders jsonb DEFAULT '[]'::jsonb,
  style_config jsonb DEFAULT '{}'::jsonb,
  is_public boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE video_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates and public templates"
  ON video_templates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can create their own templates"
  ON video_templates FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own templates"
  ON video_templates FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create video_analytics table
CREATE TABLE IF NOT EXISTS video_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES user_videos(id) ON DELETE CASCADE,
  viewer_id text NOT NULL,
  watch_duration integer NOT NULL DEFAULT 0,
  completion_rate float NOT NULL DEFAULT 0,
  interactions jsonb DEFAULT '[]'::jsonb,
  dropped_at float,
  device_type text,
  location text,
  watched_at timestamptz DEFAULT now()
);

ALTER TABLE video_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics for their videos"
  ON video_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_videos
      WHERE user_videos.id = video_analytics.video_id
      AND user_videos.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert analytics"
  ON video_analytics FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create video_translations table
CREATE TABLE IF NOT EXISTS video_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_video_id uuid REFERENCES user_videos(id) ON DELETE CASCADE,
  language_code text NOT NULL,
  translated_script text NOT NULL,
  voiceover_url text,
  lipsync_video_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE video_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view translations of their videos"
  ON video_translations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_videos
      WHERE user_videos.id = video_translations.original_video_id
      AND user_videos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create translations for their videos"
  ON video_translations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_videos
      WHERE user_videos.id = video_translations.original_video_id
      AND user_videos.user_id = auth.uid()
    )
  );

-- Create video_seo_metadata table
CREATE TABLE IF NOT EXISTS video_seo_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES user_videos(id) ON DELETE CASCADE,
  optimized_title text NOT NULL,
  description text,
  tags text[] DEFAULT ARRAY[]::text[],
  transcript text,
  platform_optimizations jsonb DEFAULT '{}'::jsonb,
  thumbnail_suggestions jsonb DEFAULT '[]'::jsonb,
  generated_at timestamptz DEFAULT now()
);

ALTER TABLE video_seo_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view SEO metadata for their videos"
  ON video_seo_metadata FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_videos
      WHERE user_videos.id = video_seo_metadata.video_id
      AND user_videos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create SEO metadata for their videos"
  ON video_seo_metadata FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_videos
      WHERE user_videos.id = video_seo_metadata.video_id
      AND user_videos.user_id = auth.uid()
    )
  );

-- Create engagement_predictions table
CREATE TABLE IF NOT EXISTS engagement_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES user_videos(id) ON DELETE CASCADE,
  overall_score integer NOT NULL,
  drop_off_points jsonb DEFAULT '[]'::jsonb,
  recommendations text[] DEFAULT ARRAY[]::text[],
  optimal_length integer,
  predicted_completion_rate float,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE engagement_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view predictions for their videos"
  ON engagement_predictions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_videos
      WHERE user_videos.id = engagement_predictions.video_id
      AND user_videos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create predictions for their videos"
  ON engagement_predictions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_videos
      WHERE user_videos.id = engagement_predictions.video_id
      AND user_videos.user_id = auth.uid()
    )
  );

-- Create collaboration_sessions table
CREATE TABLE IF NOT EXISTS collaboration_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES user_videos(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_code text UNIQUE NOT NULL,
  active_collaborators jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session owners and collaborators can view sessions"
  ON collaboration_sessions FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() OR is_active = true);

CREATE POLICY "Users can create collaboration sessions for their videos"
  ON collaboration_sessions FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Create collaboration_feedback table
CREATE TABLE IF NOT EXISTS collaboration_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp float NOT NULL,
  comment text NOT NULL,
  type text NOT NULL DEFAULT 'suggestion',
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE collaboration_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collaborators can view feedback in their sessions"
  ON collaboration_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collaboration_sessions
      WHERE collaboration_sessions.id = collaboration_feedback.session_id
      AND (collaboration_sessions.owner_id = auth.uid() OR collaboration_sessions.is_active = true)
    )
  );

CREATE POLICY "Collaborators can add feedback"
  ON collaboration_feedback FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create presentation_coach_feedback table
CREATE TABLE IF NOT EXISTS presentation_coach_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES user_videos(id) ON DELETE CASCADE,
  timestamp float NOT NULL,
  feedback_type text NOT NULL,
  severity text NOT NULL,
  suggestion text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE presentation_coach_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view coach feedback for their videos"
  ON presentation_coach_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_videos
      WHERE user_videos.id = presentation_coach_feedback.video_id
      AND user_videos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create coach feedback for their videos"
  ON presentation_coach_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_videos
      WHERE user_videos.id = presentation_coach_feedback.video_id
      AND user_videos.user_id = auth.uid()
    )
  );

-- Create veo_generated_backgrounds table
CREATE TABLE IF NOT EXISTS veo_generated_backgrounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  duration integer NOT NULL,
  style text NOT NULL,
  video_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE veo_generated_backgrounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generated backgrounds"
  ON veo_generated_backgrounds FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create background generations"
  ON veo_generated_backgrounds FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_chapters_video_id ON video_chapters(video_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_video_id ON video_analytics(video_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_watched_at ON video_analytics(watched_at);
CREATE INDEX IF NOT EXISTS idx_video_translations_video_id ON video_translations(original_video_id);
CREATE INDEX IF NOT EXISTS idx_video_seo_metadata_video_id ON video_seo_metadata(video_id);
CREATE INDEX IF NOT EXISTS idx_engagement_predictions_video_id ON engagement_predictions(video_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_code ON collaboration_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_collaboration_feedback_session_id ON collaboration_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_presentation_coach_video_id ON presentation_coach_feedback(video_id);
CREATE INDEX IF NOT EXISTS idx_veo_backgrounds_user_id ON veo_generated_backgrounds(user_id);
