/*
  # Fix RLS Performance - Part 6B: Video Features & User Management (Corrected)

  1. Performance Improvements
    - Optimizes RLS policies using (SELECT auth.uid()) pattern
    
  2. Tables Updated
    - video_player_branding, video_ctas, viewer_interactions
    - video_shares, video_access_logs, notification_preferences
    - ab_test_variants, video_landing_pages
    - viewer_profiles (uses viewer_email)
    - keyboard_shortcuts, user_roles
*/

-- video_player_branding
DROP POLICY IF EXISTS "Users can view own branding" ON public.video_player_branding;
DROP POLICY IF EXISTS "Users can insert own branding" ON public.video_player_branding;
DROP POLICY IF EXISTS "Users can update own branding" ON public.video_player_branding;
DROP POLICY IF EXISTS "Users can delete own branding" ON public.video_player_branding;

CREATE POLICY "Users can view own branding" ON public.video_player_branding FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can insert own branding" ON public.video_player_branding FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own branding" ON public.video_player_branding FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own branding" ON public.video_player_branding FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- video_ctas
DROP POLICY IF EXISTS "Users can manage CTAs for own videos" ON public.video_ctas;
CREATE POLICY "Users can manage CTAs for own videos" ON public.video_ctas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_videos WHERE user_videos.id = video_ctas.video_id AND user_videos.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_videos WHERE user_videos.id = video_ctas.video_id AND user_videos.user_id = (SELECT auth.uid())));

-- viewer_interactions
DROP POLICY IF EXISTS "Users can view interactions for own videos" ON public.viewer_interactions;
DROP POLICY IF EXISTS "Users can update interactions for own videos" ON public.viewer_interactions;

CREATE POLICY "Users can view interactions for own videos" ON public.viewer_interactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_videos WHERE user_videos.id = viewer_interactions.video_id AND user_videos.user_id = (SELECT auth.uid())));

CREATE POLICY "Users can update interactions for own videos" ON public.viewer_interactions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_videos WHERE user_videos.id = viewer_interactions.video_id AND user_videos.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_videos WHERE user_videos.id = viewer_interactions.video_id AND user_videos.user_id = (SELECT auth.uid())));

-- video_shares
DROP POLICY IF EXISTS "Users can manage shares for own videos" ON public.video_shares;
CREATE POLICY "Users can manage shares for own videos" ON public.video_shares FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_videos WHERE user_videos.id = video_shares.video_id AND user_videos.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_videos WHERE user_videos.id = video_shares.video_id AND user_videos.user_id = (SELECT auth.uid())));

-- video_access_logs
DROP POLICY IF EXISTS "Users can view access logs for own videos" ON public.video_access_logs;
CREATE POLICY "Users can view access logs for own videos" ON public.video_access_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_videos WHERE user_videos.id = video_access_logs.video_id AND user_videos.user_id = (SELECT auth.uid())));

-- notification_preferences
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

-- ab_test_variants
DROP POLICY IF EXISTS "Users can manage AB tests for own videos" ON public.ab_test_variants;
CREATE POLICY "Users can manage AB tests for own videos" ON public.ab_test_variants FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_videos WHERE user_videos.id = ab_test_variants.video_id AND user_videos.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_videos WHERE user_videos.id = ab_test_variants.video_id AND user_videos.user_id = (SELECT auth.uid())));

-- video_landing_pages
DROP POLICY IF EXISTS "Users can manage landing pages for own videos" ON public.video_landing_pages;
CREATE POLICY "Users can manage landing pages for own videos" ON public.video_landing_pages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_videos WHERE user_videos.id = video_landing_pages.video_id AND user_videos.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_videos WHERE user_videos.id = video_landing_pages.video_id AND user_videos.user_id = (SELECT auth.uid())));

-- viewer_profiles (uses viewer_email)
DROP POLICY IF EXISTS "Users can view viewer profiles for their video viewers" ON public.viewer_profiles;
CREATE POLICY "Users can view viewer profiles for their video viewers" ON public.viewer_profiles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.viewer_interactions vi
    JOIN public.user_videos uv ON vi.video_id = uv.id
    WHERE vi.viewer_email = viewer_profiles.viewer_email AND uv.user_id = (SELECT auth.uid())
  ));

-- keyboard_shortcuts
DROP POLICY IF EXISTS "Users can view own shortcuts" ON public.keyboard_shortcuts;
DROP POLICY IF EXISTS "Users can insert own shortcuts" ON public.keyboard_shortcuts;
DROP POLICY IF EXISTS "Users can update own shortcuts" ON public.keyboard_shortcuts;
DROP POLICY IF EXISTS "Users can delete own shortcuts" ON public.keyboard_shortcuts;

CREATE POLICY "Users can view own shortcuts" ON public.keyboard_shortcuts FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can insert own shortcuts" ON public.keyboard_shortcuts FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own shortcuts" ON public.keyboard_shortcuts FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own shortcuts" ON public.keyboard_shortcuts FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- user_roles
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can insert roles" ON public.user_roles;

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Super admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (is_super_admin((SELECT auth.uid())));
CREATE POLICY "Super admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (is_super_admin((SELECT auth.uid()))) WITH CHECK (is_super_admin((SELECT auth.uid())));
CREATE POLICY "Super admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (is_super_admin((SELECT auth.uid())));
