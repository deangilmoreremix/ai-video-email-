/*
  # Fix RLS Performance - Part 5: Video Analytics & Related Tables

  1. Performance Improvements
    - Optimizes RLS policies using (SELECT auth.uid()) pattern
    - Covers video analytics, translations, SEO, and engagement prediction tables

  2. Tables Updated
    - video_analytics
    - video_translations (uses original_video_id)
    - video_seo_metadata
    - engagement_predictions
    - video_analytics_events
    - video_analytics_enhanced
*/

-- video_analytics
DROP POLICY IF EXISTS "Users can view analytics for their videos" ON public.video_analytics;

CREATE POLICY "Users can view analytics for their videos" ON public.video_analytics
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_videos
    WHERE user_videos.id = video_analytics.video_id
    AND user_videos.user_id = (SELECT auth.uid())
  ));

-- video_translations (uses original_video_id)
DROP POLICY IF EXISTS "Users can view translations of their videos" ON public.video_translations;
DROP POLICY IF EXISTS "Users can create translations for their videos" ON public.video_translations;

CREATE POLICY "Users can view translations of their videos" ON public.video_translations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_videos
    WHERE user_videos.id = video_translations.original_video_id
    AND user_videos.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can create translations for their videos" ON public.video_translations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_videos
    WHERE user_videos.id = video_translations.original_video_id
    AND user_videos.user_id = (SELECT auth.uid())
  ));

-- video_seo_metadata
DROP POLICY IF EXISTS "Users can view SEO metadata for their videos" ON public.video_seo_metadata;
DROP POLICY IF EXISTS "Users can create SEO metadata for their videos" ON public.video_seo_metadata;

CREATE POLICY "Users can view SEO metadata for their videos" ON public.video_seo_metadata
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_videos
    WHERE user_videos.id = video_seo_metadata.video_id
    AND user_videos.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can create SEO metadata for their videos" ON public.video_seo_metadata
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_videos
    WHERE user_videos.id = video_seo_metadata.video_id
    AND user_videos.user_id = (SELECT auth.uid())
  ));

-- engagement_predictions
DROP POLICY IF EXISTS "Users can view predictions for their videos" ON public.engagement_predictions;
DROP POLICY IF EXISTS "Users can create predictions for their videos" ON public.engagement_predictions;

CREATE POLICY "Users can view predictions for their videos" ON public.engagement_predictions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_videos
    WHERE user_videos.id = engagement_predictions.video_id
    AND user_videos.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can create predictions for their videos" ON public.engagement_predictions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_videos
    WHERE user_videos.id = engagement_predictions.video_id
    AND user_videos.user_id = (SELECT auth.uid())
  ));

-- video_analytics_events
DROP POLICY IF EXISTS "Users can view analytics for own videos" ON public.video_analytics_events;

CREATE POLICY "Users can view analytics for own videos" ON public.video_analytics_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_videos
    WHERE user_videos.id = video_analytics_events.video_id
    AND user_videos.user_id = (SELECT auth.uid())
  ));

-- video_analytics_enhanced
DROP POLICY IF EXISTS "Users can view analytics for own videos" ON public.video_analytics_enhanced;
DROP POLICY IF EXISTS "Users can insert analytics for own videos" ON public.video_analytics_enhanced;
DROP POLICY IF EXISTS "Users can update analytics for own videos" ON public.video_analytics_enhanced;

CREATE POLICY "Users can view analytics for own videos" ON public.video_analytics_enhanced
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_videos
    WHERE user_videos.id = video_analytics_enhanced.video_id
    AND user_videos.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can insert analytics for own videos" ON public.video_analytics_enhanced
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_videos
    WHERE user_videos.id = video_analytics_enhanced.video_id
    AND user_videos.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can update analytics for own videos" ON public.video_analytics_enhanced
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_videos
    WHERE user_videos.id = video_analytics_enhanced.video_id
    AND user_videos.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_videos
    WHERE user_videos.id = video_analytics_enhanced.video_id
    AND user_videos.user_id = (SELECT auth.uid())
  ));
