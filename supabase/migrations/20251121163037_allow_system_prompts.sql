/*
  # Allow System-Wide Prompts

  1. Changes
    - Modify saved_prompts table to allow NULL user_id for system prompts
    - Update RLS policies to allow public access to system prompts
  
  2. Security
    - Public prompts with NULL user_id are readable by everyone
    - Users can still create their own private prompts
*/

-- Allow NULL user_id for system prompts
ALTER TABLE saved_prompts ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policy to allow reading public system prompts
DROP POLICY IF EXISTS "Users can view public prompts" ON saved_prompts;

CREATE POLICY "Users can view public prompts and system prompts"
  ON saved_prompts FOR SELECT
  TO authenticated
  USING (is_public = true OR user_id = auth.uid());
