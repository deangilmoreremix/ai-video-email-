/*
  # Add Helper Functions

  1. Functions
    - `increment_template_usage` - Increment usage count for templates
    - `get_video_analytics_summary` - Get analytics summary for a video

  2. Security
    - Functions use SECURITY DEFINER for controlled access
    - RLS policies still apply to underlying tables
*/

CREATE OR REPLACE FUNCTION increment_template_usage(template_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE video_templates
  SET usage_count = usage_count + 1,
      updated_at = now()
  WHERE id = template_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_video_analytics_summary(p_video_id uuid)
RETURNS TABLE (
  total_views bigint,
  unique_viewers bigint,
  avg_watch_duration numeric,
  avg_completion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_views,
    COUNT(DISTINCT viewer_id)::bigint as unique_viewers,
    AVG(watch_duration)::numeric as avg_watch_duration,
    AVG(completion_rate)::numeric as avg_completion_rate
  FROM video_analytics
  WHERE video_id = p_video_id;
END;
$$;