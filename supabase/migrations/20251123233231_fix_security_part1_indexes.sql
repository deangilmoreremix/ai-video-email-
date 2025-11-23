/*
  # Fix Security Issues - Part 1: Add Foreign Key Indexes

  1. Performance Improvements
    - Adds indexes for all unindexed foreign keys
    - Improves query performance for foreign key lookups
    - Covers 16 tables with missing foreign key indexes

  2. Security
    - Enhances query performance for RLS policy checks
*/

CREATE INDEX IF NOT EXISTS idx_ab_test_variants_video_id ON public.ab_test_variants(video_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_master_video_id ON public.campaigns(master_video_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_feedback_user_id ON public.collaboration_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_owner_id ON public.collaboration_sessions(owner_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_video_id ON public.collaboration_sessions(video_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_updated_by ON public.feature_flags(updated_by);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_by ON public.system_settings(updated_by);
CREATE INDEX IF NOT EXISTS idx_template_scripts_template_id ON public.template_scripts(template_id);
CREATE INDEX IF NOT EXISTS idx_video_ctas_video_id ON public.video_ctas(video_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_user_id_fk ON public.video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_video_id_fk ON public.video_progress(video_id);
CREATE INDEX IF NOT EXISTS idx_video_shares_video_id_fk ON public.video_shares(video_id);
CREATE INDEX IF NOT EXISTS idx_video_templates_user_id_fk ON public.video_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_viewer_interactions_parent_id ON public.viewer_interactions(parent_id);
CREATE INDEX IF NOT EXISTS idx_viewer_interactions_video_id_fk ON public.viewer_interactions(video_id);
