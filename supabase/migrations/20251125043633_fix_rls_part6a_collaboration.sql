/*
  # Fix RLS Performance - Part 6A: Collaboration & Feedback

  1. Performance Improvements
    - Optimizes RLS policies using (SELECT auth.uid()) pattern
    
  2. Tables Updated
    - collaboration_sessions
    - collaboration_feedback
    - presentation_coach_feedback
    - template_scripts
    - video_progress
    - user_onboarding
*/

-- collaboration_sessions
DROP POLICY IF EXISTS "Session owners and collaborators can view sessions" ON public.collaboration_sessions;
DROP POLICY IF EXISTS "Users can create collaboration sessions for their videos" ON public.collaboration_sessions;

CREATE POLICY "Session owners and collaborators can view sessions" ON public.collaboration_sessions
  FOR SELECT TO authenticated
  USING (
    owner_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.user_videos
      WHERE user_videos.id = collaboration_sessions.video_id
      AND user_videos.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can create collaboration sessions for their videos" ON public.collaboration_sessions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_videos
    WHERE user_videos.id = collaboration_sessions.video_id
    AND user_videos.user_id = (SELECT auth.uid())
  ));

-- collaboration_feedback
DROP POLICY IF EXISTS "Collaborators can view feedback in their sessions" ON public.collaboration_feedback;
DROP POLICY IF EXISTS "Collaborators can add feedback" ON public.collaboration_feedback;

CREATE POLICY "Collaborators can view feedback in their sessions" ON public.collaboration_feedback
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.collaboration_sessions
    WHERE collaboration_sessions.id = collaboration_feedback.session_id
    AND (
      collaboration_sessions.owner_id = (SELECT auth.uid()) OR
      EXISTS (
        SELECT 1 FROM public.user_videos
        WHERE user_videos.id = collaboration_sessions.video_id
        AND user_videos.user_id = (SELECT auth.uid())
      )
    )
  ));

CREATE POLICY "Collaborators can add feedback" ON public.collaboration_feedback
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.collaboration_sessions
      WHERE collaboration_sessions.id = collaboration_feedback.session_id
      AND (
        collaboration_sessions.owner_id = (SELECT auth.uid()) OR
        EXISTS (
          SELECT 1 FROM public.user_videos
          WHERE user_videos.id = collaboration_sessions.video_id
          AND user_videos.user_id = (SELECT auth.uid())
        )
      )
    )
  );

-- presentation_coach_feedback
DROP POLICY IF EXISTS "Users can view coach feedback for their videos" ON public.presentation_coach_feedback;
DROP POLICY IF EXISTS "Users can create coach feedback for their videos" ON public.presentation_coach_feedback;

CREATE POLICY "Users can view coach feedback for their videos" ON public.presentation_coach_feedback
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_videos
    WHERE user_videos.id = presentation_coach_feedback.video_id
    AND user_videos.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can create coach feedback for their videos" ON public.presentation_coach_feedback
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_videos
    WHERE user_videos.id = presentation_coach_feedback.video_id
    AND user_videos.user_id = (SELECT auth.uid())
  ));

-- template_scripts (no is_public column - public flag is in video_templates)
DROP POLICY IF EXISTS "Users can view public template scripts" ON public.template_scripts;
DROP POLICY IF EXISTS "Users can manage own template scripts" ON public.template_scripts;

CREATE POLICY "Users can view public template scripts" ON public.template_scripts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.video_templates
    WHERE video_templates.id = template_scripts.template_id
    AND (video_templates.user_id = (SELECT auth.uid()) OR video_templates.is_public = true)
  ));

CREATE POLICY "Users can manage own template scripts" ON public.template_scripts
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.video_templates
    WHERE video_templates.id = template_scripts.template_id
    AND video_templates.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.video_templates
    WHERE video_templates.id = template_scripts.template_id
    AND video_templates.user_id = (SELECT auth.uid())
  ));

-- video_progress
DROP POLICY IF EXISTS "Users can view own progress" ON public.video_progress;
DROP POLICY IF EXISTS "Users can manage own progress" ON public.video_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.video_progress;

CREATE POLICY "Users can view own progress" ON public.video_progress
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can manage own progress" ON public.video_progress
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- user_onboarding
DROP POLICY IF EXISTS "Users can view own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can create own onboarding" ON public.user_onboarding;
DROP POLICY IF EXISTS "Users can update own onboarding" ON public.user_onboarding;

CREATE POLICY "Users can view own onboarding" ON public.user_onboarding
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own onboarding" ON public.user_onboarding
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own onboarding" ON public.user_onboarding
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
