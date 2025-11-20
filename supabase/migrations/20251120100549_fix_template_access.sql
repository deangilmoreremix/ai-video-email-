/*
  # Fix Template Access

  1. Changes
    - Allow anonymous users to view public templates
    - Keep existing authenticated user policies

  2. Security
    - Public templates visible to everyone
    - Private templates only visible to owner
*/

-- Drop existing policy for viewing templates
DROP POLICY IF EXISTS "Users can view public templates" ON video_templates;

-- Create new policy that allows anyone to view public templates
CREATE POLICY "Anyone can view public templates"
  ON video_templates FOR SELECT
  USING (is_public = true);

-- Create policy for authenticated users to view their own templates
CREATE POLICY "Users can view own templates"
  ON video_templates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow authenticated users to create templates
CREATE POLICY "Users can create templates"
  ON video_templates FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to update own templates
CREATE POLICY "Users can update own templates"
  ON video_templates FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());