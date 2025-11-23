/*
  # API Usage Tracking Tables

  ## Overview
  Creates tables to track API usage, quotas, and request queues for rate limit management.

  ## New Tables

  ### api_usage_logs
  Tracks all API requests made to external services (Gemini, etc.)
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `api_provider` (text) - gemini, openai, etc.
  - `api_model` (text) - gemini-2.5-flash, etc.
  - `endpoint` (text) - API endpoint called
  - `request_type` (text) - generate_content, etc.
  - `tokens_used` (integer) - Tokens consumed
  - `status` (text) - success, error, rate_limited
  - `error_message` (text) - Error details if failed
  - `response_time_ms` (integer) - Response time
  - `metadata` (jsonb) - Additional data
  - `created_at` (timestamptz)

  ### api_quotas
  Tracks daily/monthly quotas for each API provider
  - `id` (uuid, primary key)
  - `api_provider` (text)
  - `api_model` (text)
  - `quota_type` (text) - daily, monthly, per_minute
  - `quota_limit` (integer) - Maximum allowed
  - `quota_used` (integer) - Current usage
  - `reset_at` (timestamptz) - When quota resets
  - `updated_at` (timestamptz)

  ### api_request_queue
  Queue for API requests to prevent rate limiting
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `api_provider` (text)
  - `api_model` (text)
  - `request_data` (jsonb) - Request payload
  - `priority` (integer) - Higher = more urgent
  - `status` (text) - pending, processing, completed, failed
  - `retry_count` (integer) - Number of retries
  - `scheduled_for` (timestamptz) - When to process
  - `processed_at` (timestamptz)
  - `result` (jsonb) - Response data
  - `error_message` (text)
  - `created_at` (timestamptz)

  ### api_rate_limits
  Configuration for rate limits per API provider
  - `id` (uuid, primary key)
  - `api_provider` (text, unique)
  - `api_model` (text)
  - `requests_per_minute` (integer)
  - `requests_per_day` (integer)
  - `requests_per_month` (integer)
  - `current_minute_count` (integer)
  - `current_day_count` (integer)
  - `current_month_count` (integer)
  - `minute_reset_at` (timestamptz)
  - `day_reset_at` (timestamptz)
  - `month_reset_at` (timestamptz)
  - `is_enabled` (boolean)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can view their own usage logs
  - Super admins can view all data
*/

-- API Usage Logs Table
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  api_provider text NOT NULL,
  api_model text NOT NULL,
  endpoint text NOT NULL,
  request_type text NOT NULL,
  tokens_used integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  response_time_ms integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('success', 'error', 'rate_limited', 'pending', 'queued'))
);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created ON api_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_provider ON api_usage_logs(api_provider, api_model);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_status ON api_usage_logs(status);

ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API usage"
  ON api_usage_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all API usage"
  ON api_usage_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "System can insert API usage logs"
  ON api_usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- API Quotas Table
CREATE TABLE IF NOT EXISTS api_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_provider text NOT NULL,
  api_model text NOT NULL,
  quota_type text NOT NULL,
  quota_limit integer NOT NULL DEFAULT 0,
  quota_used integer NOT NULL DEFAULT 0,
  reset_at timestamptz NOT NULL,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_quota_type CHECK (quota_type IN ('daily', 'monthly', 'per_minute', 'per_hour')),
  CONSTRAINT unique_quota UNIQUE (api_provider, api_model, quota_type)
);

CREATE INDEX IF NOT EXISTS idx_api_quotas_provider ON api_quotas(api_provider, api_model);
CREATE INDEX IF NOT EXISTS idx_api_quotas_reset ON api_quotas(reset_at);

ALTER TABLE api_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage quotas"
  ON api_quotas FOR ALL
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

CREATE POLICY "All users can view quotas"
  ON api_quotas FOR SELECT
  TO authenticated
  USING (true);

-- API Request Queue Table
CREATE TABLE IF NOT EXISTS api_request_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  api_provider text NOT NULL,
  api_model text NOT NULL,
  request_data jsonb NOT NULL,
  priority integer DEFAULT 5,
  status text NOT NULL DEFAULT 'pending',
  retry_count integer DEFAULT 0,
  scheduled_for timestamptz DEFAULT now(),
  processed_at timestamptz,
  result jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_queue_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  CONSTRAINT valid_priority CHECK (priority >= 1 AND priority <= 10)
);

CREATE INDEX IF NOT EXISTS idx_api_queue_status ON api_request_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_api_queue_user ON api_request_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_api_queue_priority ON api_request_queue(priority DESC, created_at ASC);

ALTER TABLE api_request_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own queued requests"
  ON api_request_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests"
  ON api_request_queue FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all queue items"
  ON api_request_queue FOR ALL
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

-- API Rate Limits Table
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_provider text NOT NULL,
  api_model text NOT NULL,
  requests_per_minute integer DEFAULT 60,
  requests_per_day integer DEFAULT 1500,
  requests_per_month integer DEFAULT 50000,
  current_minute_count integer DEFAULT 0,
  current_day_count integer DEFAULT 0,
  current_month_count integer DEFAULT 0,
  minute_reset_at timestamptz DEFAULT now() + interval '1 minute',
  day_reset_at timestamptz DEFAULT date_trunc('day', now() + interval '1 day'),
  month_reset_at timestamptz DEFAULT date_trunc('month', now() + interval '1 month'),
  is_enabled boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_rate_limit UNIQUE (api_provider, api_model)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_provider ON api_rate_limits(api_provider, api_model);

ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view rate limits"
  ON api_rate_limits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage rate limits"
  ON api_rate_limits FOR ALL
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

-- Helper function to check if request can proceed
CREATE OR REPLACE FUNCTION can_make_api_request(
  p_api_provider text,
  p_api_model text
)
RETURNS boolean AS $$
DECLARE
  v_limit record;
  v_can_proceed boolean := true;
BEGIN
  SELECT * INTO v_limit
  FROM api_rate_limits
  WHERE api_provider = p_api_provider
    AND api_model = p_api_model
    AND is_enabled = true;

  IF NOT FOUND THEN
    RETURN true;
  END IF;

  -- Check and reset counters if needed
  IF v_limit.minute_reset_at < now() THEN
    UPDATE api_rate_limits
    SET current_minute_count = 0,
        minute_reset_at = now() + interval '1 minute'
    WHERE api_provider = p_api_provider AND api_model = p_api_model;
  END IF;

  IF v_limit.day_reset_at < now() THEN
    UPDATE api_rate_limits
    SET current_day_count = 0,
        day_reset_at = date_trunc('day', now() + interval '1 day')
    WHERE api_provider = p_api_provider AND api_model = p_api_model;
  END IF;

  IF v_limit.month_reset_at < now() THEN
    UPDATE api_rate_limits
    SET current_month_count = 0,
        month_reset_at = date_trunc('month', now() + interval '1 month')
    WHERE api_provider = p_api_provider AND api_model = p_api_model;
  END IF;

  -- Refresh the limit record
  SELECT * INTO v_limit
  FROM api_rate_limits
  WHERE api_provider = p_api_provider AND api_model = p_api_model;

  -- Check if limits are exceeded
  IF v_limit.current_minute_count >= v_limit.requests_per_minute THEN
    RETURN false;
  END IF;

  IF v_limit.current_day_count >= v_limit.requests_per_day THEN
    RETURN false;
  END IF;

  IF v_limit.current_month_count >= v_limit.requests_per_month THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to increment API request counter
CREATE OR REPLACE FUNCTION increment_api_counter(
  p_api_provider text,
  p_api_model text
)
RETURNS void AS $$
BEGIN
  UPDATE api_rate_limits
  SET current_minute_count = current_minute_count + 1,
      current_day_count = current_day_count + 1,
      current_month_count = current_month_count + 1,
      updated_at = now()
  WHERE api_provider = p_api_provider
    AND api_model = p_api_model;

  IF NOT FOUND THEN
    INSERT INTO api_rate_limits (api_provider, api_model, current_minute_count, current_day_count, current_month_count)
    VALUES (p_api_provider, p_api_model, 1, 1, 1);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default rate limits for Gemini
INSERT INTO api_rate_limits (api_provider, api_model, requests_per_minute, requests_per_day, requests_per_month)
VALUES
  ('gemini', 'gemini-2.5-flash', 60, 250, 7500),
  ('gemini', 'gemini-1.5-pro', 30, 50, 1500),
  ('gemini', 'gemini-1.5-flash', 60, 250, 7500)
ON CONFLICT (api_provider, api_model) DO NOTHING;

-- Insert default quotas for Gemini
INSERT INTO api_quotas (api_provider, api_model, quota_type, quota_limit, quota_used, reset_at)
VALUES
  ('gemini', 'gemini-2.5-flash', 'daily', 250, 0, date_trunc('day', now() + interval '1 day')),
  ('gemini', 'gemini-2.5-flash', 'monthly', 7500, 0, date_trunc('month', now() + interval '1 month')),
  ('gemini', 'gemini-1.5-pro', 'daily', 50, 0, date_trunc('day', now() + interval '1 day')),
  ('gemini', 'gemini-1.5-pro', 'monthly', 1500, 0, date_trunc('month', now() + interval '1 month'))
ON CONFLICT (api_provider, api_model, quota_type) DO NOTHING;
