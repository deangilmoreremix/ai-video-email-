/*
  # Fix Security Issues - Part 2: Optimize RLS Policies (Core Tables)

  1. Performance Improvements
    - Updates RLS policies to use (SELECT auth.uid()) pattern
    - Prevents re-evaluation of auth functions for each row
    - Dramatically improves query performance at scale

  2. Tables Updated
    - user_settings
    - user_videos
    - veo_generated_backgrounds
    - video_chapters
    - video_templates (consolidated duplicates)
    - voice_profiles
*/

-- user_settings policies
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON public.user_settings;

CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own settings" ON public.user_settings
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- user_videos policies
DROP POLICY IF EXISTS "Users can view own videos" ON public.user_videos;
DROP POLICY IF EXISTS "Users can insert own videos" ON public.user_videos;
DROP POLICY IF EXISTS "Users can update own videos" ON public.user_videos;
DROP POLICY IF EXISTS "Users can delete own videos" ON public.user_videos;

CREATE POLICY "Users can view own videos" ON public.user_videos
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own videos" ON public.user_videos
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own videos" ON public.user_videos
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own videos" ON public.user_videos
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- veo_generated_backgrounds policies
DROP POLICY IF EXISTS "Users can view their own generated backgrounds" ON public.veo_generated_backgrounds;
DROP POLICY IF EXISTS "Users can create background generations" ON public.veo_generated_backgrounds;

CREATE POLICY "Users can view their own generated backgrounds" ON public.veo_generated_backgrounds
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create background generations" ON public.veo_generated_backgrounds
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- video_chapters policies
DROP POLICY IF EXISTS "Users can view chapters of their videos" ON public.video_chapters;
DROP POLICY IF EXISTS "Users can insert chapters for their videos" ON public.video_chapters;

CREATE POLICY "Users can view chapters of their videos" ON public.video_chapters
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_videos
    WHERE user_videos.id = video_chapters.video_id
    AND user_videos.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can insert chapters for their videos" ON public.video_chapters
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_videos
    WHERE user_videos.id = video_chapters.video_id
    AND user_videos.user_id = (SELECT auth.uid())
  ));

-- video_templates policies - REMOVE DUPLICATES AND OPTIMIZE
DROP POLICY IF EXISTS "Users can view their own templates and public templates" ON public.video_templates;
DROP POLICY IF EXISTS "Users can view own templates" ON public.video_templates;
DROP POLICY IF EXISTS "Anyone can view public templates" ON public.video_templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON public.video_templates;
DROP POLICY IF EXISTS "Users can create templates" ON public.video_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.video_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.video_templates;

CREATE POLICY "Users can view own and public templates" ON public.video_templates
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR is_public = true);

CREATE POLICY "Users can create own templates" ON public.video_templates
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own templates" ON public.video_templates
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- voice_profiles policies
DROP POLICY IF EXISTS "Users can view own voice profiles" ON public.voice_profiles;
DROP POLICY IF EXISTS "Users can insert own voice profiles" ON public.voice_profiles;
DROP POLICY IF EXISTS "Users can update own voice profiles" ON public.voice_profiles;
DROP POLICY IF EXISTS "Users can delete own voice profiles" ON public.voice_profiles;

CREATE POLICY "Users can view own voice profiles" ON public.voice_profiles
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own voice profiles" ON public.voice_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own voice profiles" ON public.voice_profiles
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own voice profiles" ON public.voice_profiles
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));
