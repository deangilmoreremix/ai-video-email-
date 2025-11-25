/*
  # Remove Unused Indexes

  1. Performance & Storage Improvements
    - Removes indexes that have not been used
    - Reduces storage overhead
    - Improves write performance (fewer indexes to maintain)
    - Can be re-added later if query patterns change

  2. Indexes Removed
    - User & video indexes that haven't been utilized
    - Analytics & tracking indexes with no queries
    - Admin & system indexes that are unused
    - Campaign & personalization indexes

  Note: These can be recreated if usage patterns change
*/

-- User Videos
DROP INDEX IF EXISTS idx_user_videos_user_id;
DROP INDEX IF EXISTS idx_user_videos_created_at;

-- VEO Backgrounds
DROP INDEX IF EXISTS veo_generated_backgrounds_model_idx;
DROP INDEX IF EXISTS idx_veo_backgrounds_user_id;

-- Video Features
DROP INDEX IF EXISTS idx_video_chapters_video_id;
DROP INDEX IF EXISTS idx_video_analytics_video_id;
DROP INDEX IF EXISTS idx_video_analytics_watched_at;
DROP INDEX IF EXISTS idx_video_translations_video_id;
DROP INDEX IF EXISTS idx_video_seo_metadata_video_id;
DROP INDEX IF EXISTS idx_engagement_predictions_video_id;

-- Collaboration
DROP INDEX IF EXISTS idx_collaboration_sessions_code;
DROP INDEX IF EXISTS idx_collaboration_feedback_session_id;

-- Presentation Coach
DROP INDEX IF EXISTS idx_presentation_coach_video_id;

-- Analytics
DROP INDEX IF EXISTS idx_analytics_events_video_id;
DROP INDEX IF EXISTS idx_analytics_events_session;
DROP INDEX IF EXISTS idx_analytics_events_type;
DROP INDEX IF EXISTS idx_video_analytics_enhanced_video_id;

-- Voice Profiles
DROP INDEX IF EXISTS voice_profiles_user_id_idx;

-- Video Sharing
DROP INDEX IF EXISTS idx_video_shares_token;

-- Access Logs
DROP INDEX IF EXISTS idx_access_logs_video_id;

-- Contacts
DROP INDEX IF EXISTS idx_contacts_email;
DROP INDEX IF EXISTS idx_contacts_user_id;
DROP INDEX IF EXISTS idx_contacts_tags;

-- Prompts
DROP INDEX IF EXISTS idx_prompt_history_user_id;
DROP INDEX IF EXISTS idx_prompt_history_category;
DROP INDEX IF EXISTS idx_prompt_history_created_at;
DROP INDEX IF EXISTS idx_prompt_history_is_favorite;
DROP INDEX IF EXISTS idx_saved_prompts_tags;

-- Keyboard Shortcuts
DROP INDEX IF EXISTS idx_keyboard_shortcuts_user_id;

-- Admin Indexes
DROP INDEX IF EXISTS idx_admin_activity_logs_admin;
DROP INDEX IF EXISTS idx_admin_activity_logs_created;
DROP INDEX IF EXISTS idx_admin_activity_logs_action;
DROP INDEX IF EXISTS idx_admin_notifications_created;
DROP INDEX IF EXISTS idx_admin_notifications_read;
DROP INDEX IF EXISTS idx_system_settings_key;
DROP INDEX IF EXISTS idx_system_settings_category;
DROP INDEX IF EXISTS idx_feature_flags_name;
DROP INDEX IF EXISTS idx_feature_flags_enabled;
DROP INDEX IF EXISTS idx_platform_analytics_date;
DROP INDEX IF EXISTS idx_platform_analytics_type;
DROP INDEX IF EXISTS idx_security_events_created;
DROP INDEX IF EXISTS idx_security_events_type;
DROP INDEX IF EXISTS idx_security_events_severity;

-- API Indexes
DROP INDEX IF EXISTS idx_api_usage_logs_user;
DROP INDEX IF EXISTS idx_api_usage_logs_created;
DROP INDEX IF EXISTS idx_api_usage_logs_provider;
DROP INDEX IF EXISTS idx_api_usage_logs_status;
DROP INDEX IF EXISTS idx_api_quotas_provider;
DROP INDEX IF EXISTS idx_api_quotas_reset;
DROP INDEX IF EXISTS idx_api_queue_status;
DROP INDEX IF EXISTS idx_api_queue_user;
DROP INDEX IF EXISTS idx_api_queue_priority;
DROP INDEX IF EXISTS idx_api_rate_limits_provider;

-- Campaign Indexes
DROP INDEX IF EXISTS idx_campaigns_user_id;
DROP INDEX IF EXISTS idx_campaigns_status;
DROP INDEX IF EXISTS idx_campaigns_created_at;
DROP INDEX IF EXISTS idx_campaign_recipients_campaign_id;
DROP INDEX IF EXISTS idx_campaign_recipients_status;
DROP INDEX IF EXISTS idx_campaign_recipients_email;
DROP INDEX IF EXISTS idx_personalization_assets_recipient_id;
DROP INDEX IF EXISTS idx_personalization_assets_type;
DROP INDEX IF EXISTS idx_campaign_analytics_campaign_id;
DROP INDEX IF EXISTS idx_personalization_templates_user_id;
DROP INDEX IF EXISTS idx_personalization_templates_use_case;
DROP INDEX IF EXISTS idx_personalization_templates_public;

-- Recently added foreign key indexes (also unused currently)
DROP INDEX IF EXISTS idx_ab_test_variants_video_id;
DROP INDEX IF EXISTS idx_campaigns_master_video_id;
DROP INDEX IF EXISTS idx_collaboration_feedback_user_id;
DROP INDEX IF EXISTS idx_collaboration_sessions_owner_id;
DROP INDEX IF EXISTS idx_collaboration_sessions_video_id;
DROP INDEX IF EXISTS idx_feature_flags_updated_by;
DROP INDEX IF EXISTS idx_security_events_user_id;
DROP INDEX IF EXISTS idx_system_settings_updated_by;
DROP INDEX IF EXISTS idx_template_scripts_template_id;
DROP INDEX IF EXISTS idx_video_ctas_video_id;
DROP INDEX IF EXISTS idx_video_progress_user_id_fk;
DROP INDEX IF EXISTS idx_video_progress_video_id_fk;
DROP INDEX IF EXISTS idx_video_shares_video_id_fk;
DROP INDEX IF EXISTS idx_video_templates_user_id_fk;
DROP INDEX IF EXISTS idx_viewer_interactions_parent_id;
DROP INDEX IF EXISTS idx_viewer_interactions_video_id_fk;
