/*
  # Add Prompt History and Management

  1. New Tables
    - `prompt_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `original_prompt` (text)
      - `improved_prompt` (text)
      - `generated_script` (text)
      - `category` (text)
      - `context` (jsonb) - stores additional context like audience, tone, etc.
      - `quality_score` (integer) - 0-100 rating
      - `engagement_score` (integer) - 0-100 if available from video analytics
      - `is_favorite` (boolean)
      - `usage_count` (integer) - how many times this prompt was reused
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `saved_prompts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text)
      - `prompt_text` (text)
      - `category` (text)
      - `tags` (text array)
      - `context` (jsonb)
      - `is_public` (boolean) - can be shared with other users
      - `usage_count` (integer)
      - `avg_quality_score` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only access their own prompts
    - Public prompts can be viewed by all authenticated users
*/

-- Create prompt_history table
CREATE TABLE IF NOT EXISTS prompt_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_prompt text NOT NULL,
  improved_prompt text,
  generated_script text,
  category text,
  context jsonb DEFAULT '{}'::jsonb,
  quality_score integer CHECK (quality_score >= 0 AND quality_score <= 100),
  engagement_score integer CHECK (engagement_score >= 0 AND engagement_score <= 100),
  is_favorite boolean DEFAULT false,
  usage_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create saved_prompts table
CREATE TABLE IF NOT EXISTS saved_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  prompt_text text NOT NULL,
  category text,
  tags text[] DEFAULT ARRAY[]::text[],
  context jsonb DEFAULT '{}'::jsonb,
  is_public boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  avg_quality_score integer CHECK (avg_quality_score >= 0 AND avg_quality_score <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_prompt_history_user_id ON prompt_history(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_history_category ON prompt_history(category);
CREATE INDEX IF NOT EXISTS idx_prompt_history_created_at ON prompt_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_history_is_favorite ON prompt_history(is_favorite) WHERE is_favorite = true;

CREATE INDEX IF NOT EXISTS idx_saved_prompts_user_id ON saved_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_category ON saved_prompts(category);
CREATE INDEX IF NOT EXISTS idx_saved_prompts_is_public ON saved_prompts(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_saved_prompts_tags ON saved_prompts USING gin(tags);

-- Enable Row Level Security
ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompt_history
CREATE POLICY "Users can view own prompt history"
  ON prompt_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompt history"
  ON prompt_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompt history"
  ON prompt_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompt history"
  ON prompt_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for saved_prompts
CREATE POLICY "Users can view own saved prompts"
  ON saved_prompts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public prompts"
  ON saved_prompts FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can insert own saved prompts"
  ON saved_prompts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved prompts"
  ON saved_prompts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved prompts"
  ON saved_prompts FOR DELETE
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

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_prompt_history_updated_at ON prompt_history;
CREATE TRIGGER update_prompt_history_updated_at
  BEFORE UPDATE ON prompt_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saved_prompts_updated_at ON saved_prompts;
CREATE TRIGGER update_saved_prompts_updated_at
  BEFORE UPDATE ON saved_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to increment usage count
CREATE OR REPLACE FUNCTION increment_prompt_usage(prompt_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE saved_prompts
  SET usage_count = usage_count + 1
  WHERE id = prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;