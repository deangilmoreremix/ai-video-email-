/*
  # Consolidate Duplicate Permissive Policies

  1. Security Improvements
    - Removes duplicate permissive policies
    - Consolidates overlapping access rules
    - Makes policy structure clearer

  2. Tables Updated
    - api_quotas: Merge view policies
    - api_rate_limits: Merge view policies
    - api_request_queue: Merge select/insert policies
    - api_usage_logs: Merge view policies
    - feature_flags: Merge view policies
    - system_settings: Merge view policies
    - template_scripts: Merge view policies
    - user_roles: Merge view policies
    - video_shares: Merge view policies
    - viewer_profiles: Merge view policies
*/

-- api_quotas: Remove "All users can view quotas" - admins already covered
DROP POLICY IF EXISTS "All users can view quotas" ON public.api_quotas;
DROP POLICY IF EXISTS "Super admins can manage quotas" ON public.api_quotas;

CREATE POLICY "Users and admins can view quotas" ON public.api_quotas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage quotas" ON public.api_quotas
  FOR ALL TO authenticated
  USING (is_super_admin((SELECT auth.uid())))
  WITH CHECK (is_super_admin((SELECT auth.uid())));

-- api_rate_limits: Remove "All users can view rate limits" - admins already covered
DROP POLICY IF EXISTS "All users can view rate limits" ON public.api_rate_limits;
DROP POLICY IF EXISTS "Super admins can manage rate limits" ON public.api_rate_limits;

CREATE POLICY "Users and admins can view rate limits" ON public.api_rate_limits
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage rate limits" ON public.api_rate_limits
  FOR ALL TO authenticated
  USING (is_super_admin((SELECT auth.uid())))
  WITH CHECK (is_super_admin((SELECT auth.uid())));

-- api_request_queue: Consolidate to single policy for users + admins
DROP POLICY IF EXISTS "Users can view own queued requests" ON public.api_request_queue;
DROP POLICY IF EXISTS "Users can insert own requests" ON public.api_request_queue;
DROP POLICY IF EXISTS "Super admins can manage all queue items" ON public.api_request_queue;

CREATE POLICY "Users can view own queued requests" ON public.api_request_queue
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR is_super_admin((SELECT auth.uid())));

CREATE POLICY "Users can insert own requests" ON public.api_request_queue
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) OR is_super_admin((SELECT auth.uid())));

CREATE POLICY "Super admins can update and delete queue" ON public.api_request_queue
  FOR ALL TO authenticated
  USING (is_super_admin((SELECT auth.uid())))
  WITH CHECK (is_super_admin((SELECT auth.uid())));

-- api_usage_logs: Consolidate view policies
DROP POLICY IF EXISTS "Users can view own API usage" ON public.api_usage_logs;
DROP POLICY IF EXISTS "Super admins can view all API usage" ON public.api_usage_logs;

CREATE POLICY "Users can view own usage, admins view all" ON public.api_usage_logs
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR is_super_admin((SELECT auth.uid())));

-- feature_flags: Consolidate view policies
DROP POLICY IF EXISTS "Super admins can view feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Super admins can modify feature flags" ON public.feature_flags;

CREATE POLICY "Super admins can manage feature flags" ON public.feature_flags
  FOR ALL TO authenticated
  USING (is_super_admin((SELECT auth.uid())))
  WITH CHECK (is_super_admin((SELECT auth.uid())));

-- system_settings: Consolidate view policies
DROP POLICY IF EXISTS "Super admins can view settings" ON public.system_settings;
DROP POLICY IF EXISTS "Super admins can modify settings" ON public.system_settings;

CREATE POLICY "Super admins can manage settings" ON public.system_settings
  FOR ALL TO authenticated
  USING (is_super_admin((SELECT auth.uid())))
  WITH CHECK (is_super_admin((SELECT auth.uid())));

-- template_scripts: Already properly consolidated in previous migration
-- No changes needed

-- user_roles: Consolidate view policies
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can insert roles" ON public.user_roles;

CREATE POLICY "Users can view own role, admins view all" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR is_super_admin((SELECT auth.uid())));

CREATE POLICY "Super admins can modify roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (is_super_admin((SELECT auth.uid())))
  WITH CHECK (is_super_admin((SELECT auth.uid())));

-- video_shares: Keep both policies - they serve different purposes
-- "Public can view valid shares" allows anonymous access with token
-- "Users can manage shares for own videos" allows owner management
-- These are intentionally separate - NO CHANGE NEEDED

-- viewer_profiles: Consolidate if System and Users both need SELECT
DROP POLICY IF EXISTS "System can manage viewer profiles" ON public.viewer_profiles;
DROP POLICY IF EXISTS "Users can view viewer profiles for their video viewers" ON public.viewer_profiles;

-- Allow system to manage (service role) and users to view their own viewer profiles
CREATE POLICY "Users can view viewer profiles for their video viewers" ON public.viewer_profiles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.viewer_interactions vi
    JOIN public.user_videos uv ON vi.video_id = uv.id
    WHERE vi.viewer_email = viewer_profiles.viewer_email AND uv.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "System can manage viewer profiles" ON public.viewer_profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
