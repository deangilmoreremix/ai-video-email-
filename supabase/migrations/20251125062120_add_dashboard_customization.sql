/*
  # Dashboard Customization and AI Assistance Tables

  1. New Tables
    - `dashboard_layouts`
      - Stores user-specific dashboard configurations
      - Widget positions and visibility preferences
      - Last updated timestamp
    
    - `ai_suggestions`
      - Tracks AI-generated text suggestions
      - Context and prompt used
      - User acceptance/rejection for learning
      - Performance metrics
    
    - `user_dashboard_preferences`
      - UI theme preferences (light/dark)
      - Default view modes
      - Notification settings
      - AI assistance level preferences
    
    - `quick_actions`
      - Custom user shortcuts
      - Frequently used features tracking
      - Pinned templates and workflows

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Proper indexes for performance
*/

-- Dashboard Layouts
CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  layout_name text DEFAULT 'default',
  widget_config jsonb DEFAULT '[]'::jsonb,
  visibility_config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, layout_name)
);

ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dashboard layouts"
  ON dashboard_layouts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dashboard layouts"
  ON dashboard_layouts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dashboard layouts"
  ON dashboard_layouts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dashboard layouts"
  ON dashboard_layouts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- AI Suggestions Tracking
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  context_type text NOT NULL,
  original_text text,
  suggested_text text NOT NULL,
  prompt_used text,
  tone text,
  accepted boolean DEFAULT false,
  applied_at timestamptz,
  generation_time_ms integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI suggestions"
  ON ai_suggestions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI suggestions"
  ON ai_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI suggestions"
  ON ai_suggestions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User Dashboard Preferences
CREATE TABLE IF NOT EXISTS user_dashboard_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text DEFAULT 'dark',
  default_view text DEFAULT 'overview',
  notifications_enabled boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  ai_assistance_level text DEFAULT 'full',
  show_tutorials boolean DEFAULT true,
  compact_mode boolean DEFAULT false,
  sidebar_collapsed boolean DEFAULT false,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_dashboard_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dashboard preferences"
  ON user_dashboard_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dashboard preferences"
  ON user_dashboard_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dashboard preferences"
  ON user_dashboard_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Quick Actions Tracking
CREATE TABLE IF NOT EXISTS quick_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL,
  action_label text NOT NULL,
  action_target text NOT NULL,
  usage_count integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, action_type, action_target)
);

ALTER TABLE quick_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quick actions"
  ON quick_actions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quick actions"
  ON quick_actions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quick actions"
  ON quick_actions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quick actions"
  ON quick_actions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user_id ON dashboard_layouts(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_active ON dashboard_layouts(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_context ON ai_suggestions(user_id, context_type);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_accepted ON ai_suggestions(user_id, accepted) WHERE accepted = true;
CREATE INDEX IF NOT EXISTS idx_quick_actions_user_id ON quick_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_quick_actions_pinned ON quick_actions(user_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_quick_actions_usage ON quick_actions(user_id, usage_count DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dashboard_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_dashboard_layouts_updated_at
  BEFORE UPDATE ON dashboard_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_updated_at();

CREATE TRIGGER update_user_dashboard_preferences_updated_at
  BEFORE UPDATE ON user_dashboard_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_updated_at();

-- Function to track quick action usage
CREATE OR REPLACE FUNCTION increment_quick_action_usage(
  p_user_id uuid,
  p_action_type text,
  p_action_target text,
  p_action_label text
)
RETURNS void AS $$
BEGIN
  INSERT INTO quick_actions (user_id, action_type, action_target, action_label, usage_count, last_used_at)
  VALUES (p_user_id, p_action_type, p_action_target, p_action_label, 1, now())
  ON CONFLICT (user_id, action_type, action_target)
  DO UPDATE SET
    usage_count = quick_actions.usage_count + 1,
    last_used_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
