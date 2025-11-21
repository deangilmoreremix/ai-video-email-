/*
  # Allow Anonymous Access to Public Prompts

  1. Changes
    - Update RLS policy to allow both authenticated AND anonymous users to view public prompts
    - This ensures the Community tab works even without login
  
  2. Security
    - Public system prompts (user_id IS NULL and is_public = true) are readable by everyone
    - User's own prompts are readable only when authenticated
    - Other users' private prompts remain protected
*/

-- Drop existing policy and recreate to allow anon access
DROP POLICY IF EXISTS "Users can view accessible prompts" ON saved_prompts;

CREATE POLICY "Anyone can view public prompts"
  ON saved_prompts FOR SELECT
  TO anon, authenticated
  USING (
    is_public = true OR 
    user_id IS NULL OR
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );
