/*
  # Admin Panel Database Tables

  ## Overview
  Creates comprehensive tables for super admin dashboard functionality including
  activity logging, notifications, system settings, feature flags, and audit trails.

  ## New Tables

  ### admin_activity_logs
  Tracks all admin actions for security and compliance
  - `id` (uuid, primary key)
  - `admin_user_id` (uuid, references auth.users)
  - `action_type` (text) - Type of action performed
  - `target_type` (text) - What was acted upon (user, video, setting, etc.)
  - `target_id` (uuid) - ID of the target entity
  - `details` (jsonb) - Additional action details
  - `ip_address` (text) - Admin's IP address
  - `created_at` (timestamptz)

  ### admin_notifications
  System notifications for admins
  - `id` (uuid, primary key)
  - `type` (text) - warning, error, info, success
  - `title` (text)
  - `message` (text)
  - `severity` (text) - low, medium, high, critical
  - `is_read` (boolean)
  - `metadata` (jsonb) - Additional data
  - `created_at` (timestamptz)

  ### system_settings
  Global platform configuration
  - `id` (uuid, primary key)
  - `setting_key` (text, unique)
  - `setting_value` (jsonb)
  - `category` (text) - general, api, security, features
  - `description` (text)
  - `updated_by` (uuid, references auth.users)
  - `updated_at` (timestamptz)

  ### feature_flags
  Control feature availability and rollout
  - `id` (uuid, primary key)
  - `feature_name` (text, unique)
  - `is_enabled` (boolean)
  - `rollout_percentage` (integer) - 0-100 for gradual rollout
  - `allowed_user_ids` (uuid[]) - Specific users who can access
  - `description` (text)
  - `updated_by` (uuid, references auth.users)
  - `updated_at` (timestamptz)

  ### platform_analytics
  Aggregated platform-wide metrics
  - `id` (uuid, primary key)
  - `date` (date)
  - `metric_type` (text) - users, videos, api_calls, storage
  - `metric_value` (numeric)
  - `metadata` (jsonb) - Additional breakdown
  - `created_at` (timestamptz)

  ### security_events
  Track security-related events
  - `id` (uuid, primary key)
  - `event_type` (text) - failed_login, suspicious_activity, rate_limit
  - `user_id` (uuid, references auth.users)
  - `ip_address` (text)
  - `user_agent` (text)
  - `details` (jsonb)
  - `severity` (text) - low, medium, high, critical
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Only super admins can access these tables
  - All modifications are logged
*/

-- Admin Activity Logs Table
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin ON admin_activity_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created ON admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_action ON admin_activity_logs(action_type);

ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view activity logs"
  ON admin_activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can insert activity logs"
  ON admin_activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- Admin Notifications Table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'low',
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_type CHECK (type IN ('warning', 'error', 'info', 'success')),
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(is_read);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view notifications"
  ON admin_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update notifications"
  ON admin_notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_category CHECK (category IN ('general', 'api', 'security', 'features', 'storage'))
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can modify settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- Feature Flags Table
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name text UNIQUE NOT NULL,
  is_enabled boolean DEFAULT false,
  rollout_percentage integer DEFAULT 0,
  allowed_user_ids uuid[] DEFAULT ARRAY[]::uuid[],
  description text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_percentage CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100)
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view feature flags"
  ON feature_flags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can modify feature flags"
  ON feature_flags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- Platform Analytics Table
CREATE TABLE IF NOT EXISTS platform_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  metric_type text NOT NULL,
  metric_value numeric NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_daily_metric UNIQUE (date, metric_type)
);

CREATE INDEX IF NOT EXISTS idx_platform_analytics_date ON platform_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_platform_analytics_type ON platform_analytics(metric_type);

ALTER TABLE platform_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view analytics"
  ON platform_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "System can insert analytics"
  ON platform_analytics FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Security Events Table
CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  details jsonb DEFAULT '{}'::jsonb,
  severity text NOT NULL DEFAULT 'low',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view security events"
  ON security_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "System can insert security events"
  ON security_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Helper function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_action_type text,
  p_target_type text DEFAULT NULL,
  p_target_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO admin_activity_logs (admin_user_id, action_type, target_type, target_id, details)
  VALUES (auth.uid(), p_action_type, p_target_type, p_target_id, p_details)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, category, description)
VALUES
  ('maintenance_mode', '{"enabled": false, "message": "We are performing maintenance. Please check back soon."}'::jsonb, 'general', 'Platform maintenance mode'),
  ('max_video_size_mb', '500'::jsonb, 'storage', 'Maximum video file size in MB'),
  ('max_storage_per_user_gb', '10'::jsonb, 'storage', 'Maximum storage per user in GB'),
  ('api_rate_limit_per_minute', '60'::jsonb, 'api', 'API calls per minute per user'),
  ('require_email_verification', 'false'::jsonb, 'security', 'Require email verification on signup'),
  ('session_timeout_hours', '24'::jsonb, 'security', 'User session timeout in hours')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default feature flags
INSERT INTO feature_flags (feature_name, is_enabled, rollout_percentage, description)
VALUES
  ('veo_background_generation', true, 100, 'Veo 2 AI background generation'),
  ('video_chapters', true, 100, 'Smart video chapters detection'),
  ('video_seo_optimizer', true, 100, 'AI-powered SEO optimization'),
  ('voice_cloning', true, 100, 'Voice analysis and cloning'),
  ('engagement_prediction', true, 100, 'AI engagement prediction'),
  ('multi_language_translation', true, 100, 'Video translation to multiple languages'),
  ('collaboration_sessions', true, 100, 'Team collaboration features'),
  ('video_templates', true, 100, 'Reusable video templates'),
  ('presentation_coach', true, 100, 'Real-time presentation coaching'),
  ('video_analytics', true, 100, 'Advanced video analytics dashboard')
ON CONFLICT (feature_name) DO NOTHING;
