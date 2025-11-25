/*
  # User Onboarding and Help System

  1. New Tables
    - `user_onboarding_progress`
      - `user_id` (uuid, foreign key to auth.users)
      - `tour_completed` (boolean, default false)
      - `current_step` (integer, tracks tour progress)
      - `features_discovered` (jsonb, tracks which features user has tried)
      - `milestones_achieved` (jsonb, tracks achievements)
      - `skip_onboarding` (boolean, default false)
      - `last_tour_interaction` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `feature_discovery`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `feature_name` (text)
      - `discovered_at` (timestamptz)
      - `first_use_at` (timestamptz, nullable)
      - `use_count` (integer, default 0)

    - `help_interactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `interaction_type` (text) - 'tooltip_view', 'help_search', 'tutorial_start', 'tutorial_complete'
      - `feature_context` (text)
      - `created_at` (timestamptz)

    - `user_achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `achievement_id` (text)
      - `achievement_name` (text)
      - `description` (text)
      - `achieved_at` (timestamptz)
      - `metadata` (jsonb, nullable)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- User Onboarding Progress
CREATE TABLE IF NOT EXISTS user_onboarding_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tour_completed boolean DEFAULT false,
  current_step integer DEFAULT 0,
  features_discovered jsonb DEFAULT '[]'::jsonb,
  milestones_achieved jsonb DEFAULT '[]'::jsonb,
  skip_onboarding boolean DEFAULT false,
  last_tour_interaction timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding progress"
  ON user_onboarding_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding progress"
  ON user_onboarding_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding progress"
  ON user_onboarding_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Feature Discovery
CREATE TABLE IF NOT EXISTS feature_discovery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  discovered_at timestamptz DEFAULT now(),
  first_use_at timestamptz,
  use_count integer DEFAULT 0,
  UNIQUE(user_id, feature_name)
);

ALTER TABLE feature_discovery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feature discovery"
  ON feature_discovery FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feature discovery"
  ON feature_discovery FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feature discovery"
  ON feature_discovery FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Help Interactions
CREATE TABLE IF NOT EXISTS help_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type text NOT NULL,
  feature_context text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE help_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own help interactions"
  ON help_interactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own help interactions"
  ON help_interactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  achievement_name text NOT NULL,
  description text NOT NULL,
  achieved_at timestamptz DEFAULT now(),
  metadata jsonb,
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feature_discovery_user_id ON feature_discovery(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_discovery_feature_name ON feature_discovery(feature_name);
CREATE INDEX IF NOT EXISTS idx_help_interactions_user_id ON help_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_help_interactions_type ON help_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_onboarding_progress_updated_at
  BEFORE UPDATE ON user_onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();