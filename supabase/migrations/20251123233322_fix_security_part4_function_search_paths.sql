/*
  # Fix Security Issues - Part 4: Fix Function Search Paths

  1. Security Improvements
    - Sets explicit search_path for all functions
    - Prevents potential SQL injection through search_path manipulation
    - Sets to 'public, pg_temp' which is the secure pattern

  2. Functions Updated
    - increment_prompt_usage
    - update_updated_at_column
    - log_admin_activity
    - can_make_api_request
    - increment_api_counter
    - get_video_analytics_summary
    - increment_template_usage
    - is_super_admin
    - handle_new_user
*/

-- Fix function search paths with correct signatures
ALTER FUNCTION public.increment_prompt_usage(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION public.log_admin_activity(text, text, uuid, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.can_make_api_request(text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_api_counter(text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_video_analytics_summary(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_template_usage(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_super_admin(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
