/*
  # Add Voice Profiles Table

  1. New Tables
    - `voice_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `voice_characteristics` (text) - AI analysis of voice
      - `language` (text) - Language code
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `voice_profiles` table
    - Add policy for users to manage their own voice profiles
*/

CREATE TABLE IF NOT EXISTS voice_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  voice_characteristics text NOT NULL,
  language text DEFAULT 'en-US',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voice profiles"
  ON voice_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice profiles"
  ON voice_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice profiles"
  ON voice_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice profiles"
  ON voice_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS voice_profiles_user_id_idx ON voice_profiles(user_id);
