/*
  # Fix Public Prompts Access

  1. Changes
    - Update RLS policy to allow viewing system prompts (where user_id is NULL)
    - Ensure public prompts are accessible to all authenticated users
  
  2. Security
    - System prompts (user_id IS NULL and is_public = true) are readable by everyone
    - User's own prompts are readable by them
    - Other users' private prompts remain protected
*/

-- Drop existing policy and recreate with correct logic
DROP POLICY IF EXISTS "Users can view public prompts and system prompts" ON saved_prompts;

CREATE POLICY "Users can view accessible prompts"
  ON saved_prompts FOR SELECT
  TO authenticated
  USING (
    is_public = true OR 
    user_id = auth.uid() OR
    user_id IS NULL
  );
