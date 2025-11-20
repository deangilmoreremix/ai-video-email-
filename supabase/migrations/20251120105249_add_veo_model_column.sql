/*
  # Add Veo Model Selection Column

  1. Changes
    - Add `veo_model` column to `veo_generated_backgrounds` table
    - Store which Veo model was used for generation
    - Default to 'veo-2' for backward compatibility

  2. Supported Models
    - veo-2: Highest quality, most realistic
    - veo-2-flash: 3x faster generation
    - veo-2-gemini: Optimized for text prompts
    - veo-003: Latest experimental version
*/

-- Add veo_model column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'veo_generated_backgrounds' 
    AND column_name = 'veo_model'
  ) THEN
    ALTER TABLE veo_generated_backgrounds 
    ADD COLUMN veo_model text DEFAULT 'veo-2' 
    CHECK (veo_model IN ('veo-2', 'veo-2-flash', 'veo-2-gemini', 'veo-003'));
  END IF;
END $$;

-- Add index for filtering by model
CREATE INDEX IF NOT EXISTS veo_generated_backgrounds_model_idx 
ON veo_generated_backgrounds(veo_model);
