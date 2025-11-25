/*
  # Fix RLS Performance - Part 7: Admin, API & Campaign Tables

  1. Performance Improvements
    - Optimizes RLS policies using (SELECT auth.uid()) pattern
    
  2. Tables Updated
    - Admin: admin_activity_logs, admin_notifications, system_settings, feature_flags, platform_analytics, security_events
    - API: api_usage_logs, api_quotas, api_request_queue, api_rate_limits
    - Campaign: campaign_recipients, personalization_assets, campaign_analytics, personalization_templates
*/

-- admin_activity_logs
DROP POLICY IF EXISTS "Super admins can view activity logs" ON public.admin_activity_logs;
DROP POLICY IF EXISTS "Super admins can insert activity logs" ON public.admin_activity_logs;

CREATE POLICY "Super admins can view activity logs" ON public.admin_activity_logs FOR SELECT TO authenticated USING (is_super_admin((SELECT auth.uid())));
CREATE POLICY "Super admins can insert activity logs" ON public.admin_activity_logs FOR INSERT TO authenticated WITH CHECK (is_super_admin((SELECT auth.uid())));

-- admin_notifications
DROP POLICY IF EXISTS "Super admins can view notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Super admins can update notifications" ON public.admin_notifications;

CREATE POLICY "Super admins can view notifications" ON public.admin_notifications FOR SELECT TO authenticated USING (is_super_admin((SELECT auth.uid())));
CREATE POLICY "Super admins can update notifications" ON public.admin_notifications FOR UPDATE TO authenticated USING (is_super_admin((SELECT auth.uid()))) WITH CHECK (is_super_admin((SELECT auth.uid())));

-- system_settings
DROP POLICY IF EXISTS "Super admins can view settings" ON public.system_settings;
DROP POLICY IF EXISTS "Super admins can modify settings" ON public.system_settings;

CREATE POLICY "Super admins can view settings" ON public.system_settings FOR SELECT TO authenticated USING (is_super_admin((SELECT auth.uid())));
CREATE POLICY "Super admins can modify settings" ON public.system_settings FOR ALL TO authenticated USING (is_super_admin((SELECT auth.uid()))) WITH CHECK (is_super_admin((SELECT auth.uid())));

-- feature_flags
DROP POLICY IF EXISTS "Super admins can view feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Super admins can modify feature flags" ON public.feature_flags;

CREATE POLICY "Super admins can view feature flags" ON public.feature_flags FOR SELECT TO authenticated USING (is_super_admin((SELECT auth.uid())));
CREATE POLICY "Super admins can modify feature flags" ON public.feature_flags FOR ALL TO authenticated USING (is_super_admin((SELECT auth.uid()))) WITH CHECK (is_super_admin((SELECT auth.uid())));

-- platform_analytics
DROP POLICY IF EXISTS "Super admins can view analytics" ON public.platform_analytics;
CREATE POLICY "Super admins can view analytics" ON public.platform_analytics FOR SELECT TO authenticated USING (is_super_admin((SELECT auth.uid())));

-- security_events
DROP POLICY IF EXISTS "Super admins can view security events" ON public.security_events;
CREATE POLICY "Super admins can view security events" ON public.security_events FOR SELECT TO authenticated USING (is_super_admin((SELECT auth.uid())));

-- api_usage_logs
DROP POLICY IF EXISTS "Users can view own API usage" ON public.api_usage_logs;
DROP POLICY IF EXISTS "Super admins can view all API usage" ON public.api_usage_logs;

CREATE POLICY "Users can view own API usage" ON public.api_usage_logs FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Super admins can view all API usage" ON public.api_usage_logs FOR SELECT TO authenticated USING (is_super_admin((SELECT auth.uid())));

-- api_quotas
DROP POLICY IF EXISTS "Super admins can manage quotas" ON public.api_quotas;
CREATE POLICY "Super admins can manage quotas" ON public.api_quotas FOR ALL TO authenticated USING (is_super_admin((SELECT auth.uid()))) WITH CHECK (is_super_admin((SELECT auth.uid())));

-- api_request_queue
DROP POLICY IF EXISTS "Users can view own queued requests" ON public.api_request_queue;
DROP POLICY IF EXISTS "Users can insert own requests" ON public.api_request_queue;
DROP POLICY IF EXISTS "Super admins can manage all queue items" ON public.api_request_queue;

CREATE POLICY "Users can view own queued requests" ON public.api_request_queue FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can insert own requests" ON public.api_request_queue FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Super admins can manage all queue items" ON public.api_request_queue FOR ALL TO authenticated USING (is_super_admin((SELECT auth.uid()))) WITH CHECK (is_super_admin((SELECT auth.uid())));

-- api_rate_limits
DROP POLICY IF EXISTS "Super admins can manage rate limits" ON public.api_rate_limits;
CREATE POLICY "Super admins can manage rate limits" ON public.api_rate_limits FOR ALL TO authenticated USING (is_super_admin((SELECT auth.uid()))) WITH CHECK (is_super_admin((SELECT auth.uid())));

-- campaign_recipients
DROP POLICY IF EXISTS "Users can view recipients of own campaigns" ON public.campaign_recipients;
DROP POLICY IF EXISTS "Users can insert recipients to own campaigns" ON public.campaign_recipients;
DROP POLICY IF EXISTS "Users can update recipients of own campaigns" ON public.campaign_recipients;
DROP POLICY IF EXISTS "Users can delete recipients from own campaigns" ON public.campaign_recipients;

CREATE POLICY "Users can view recipients of own campaigns" ON public.campaign_recipients FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = campaign_recipients.campaign_id AND campaigns.user_id = (SELECT auth.uid())));

CREATE POLICY "Users can insert recipients to own campaigns" ON public.campaign_recipients FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = campaign_recipients.campaign_id AND campaigns.user_id = (SELECT auth.uid())));

CREATE POLICY "Users can update recipients of own campaigns" ON public.campaign_recipients FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = campaign_recipients.campaign_id AND campaigns.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = campaign_recipients.campaign_id AND campaigns.user_id = (SELECT auth.uid())));

CREATE POLICY "Users can delete recipients from own campaigns" ON public.campaign_recipients FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = campaign_recipients.campaign_id AND campaigns.user_id = (SELECT auth.uid())));

-- personalization_assets
DROP POLICY IF EXISTS "Users can view assets of own campaign recipients" ON public.personalization_assets;
DROP POLICY IF EXISTS "Users can insert assets for own campaign recipients" ON public.personalization_assets;
DROP POLICY IF EXISTS "Users can update assets of own campaign recipients" ON public.personalization_assets;
DROP POLICY IF EXISTS "Users can delete assets of own campaign recipients" ON public.personalization_assets;

CREATE POLICY "Users can view assets of own campaign recipients" ON public.personalization_assets FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campaign_recipients cr JOIN public.campaigns c ON cr.campaign_id = c.id WHERE cr.id = personalization_assets.recipient_id AND c.user_id = (SELECT auth.uid())));

CREATE POLICY "Users can insert assets for own campaign recipients" ON public.personalization_assets FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.campaign_recipients cr JOIN public.campaigns c ON cr.campaign_id = c.id WHERE cr.id = personalization_assets.recipient_id AND c.user_id = (SELECT auth.uid())));

CREATE POLICY "Users can update assets of own campaign recipients" ON public.personalization_assets FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campaign_recipients cr JOIN public.campaigns c ON cr.campaign_id = c.id WHERE cr.id = personalization_assets.recipient_id AND c.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.campaign_recipients cr JOIN public.campaigns c ON cr.campaign_id = c.id WHERE cr.id = personalization_assets.recipient_id AND c.user_id = (SELECT auth.uid())));

CREATE POLICY "Users can delete assets of own campaign recipients" ON public.personalization_assets FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campaign_recipients cr JOIN public.campaigns c ON cr.campaign_id = c.id WHERE cr.id = personalization_assets.recipient_id AND c.user_id = (SELECT auth.uid())));

-- campaign_analytics
DROP POLICY IF EXISTS "Users can view analytics of own campaigns" ON public.campaign_analytics;
DROP POLICY IF EXISTS "Users can insert analytics for own campaigns" ON public.campaign_analytics;
DROP POLICY IF EXISTS "Users can update analytics of own campaigns" ON public.campaign_analytics;

CREATE POLICY "Users can view analytics of own campaigns" ON public.campaign_analytics FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = campaign_analytics.campaign_id AND campaigns.user_id = (SELECT auth.uid())));

CREATE POLICY "Users can insert analytics for own campaigns" ON public.campaign_analytics FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = campaign_analytics.campaign_id AND campaigns.user_id = (SELECT auth.uid())));

CREATE POLICY "Users can update analytics of own campaigns" ON public.campaign_analytics FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = campaign_analytics.campaign_id AND campaigns.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns WHERE campaigns.id = campaign_analytics.campaign_id AND campaigns.user_id = (SELECT auth.uid())));

-- personalization_templates
DROP POLICY IF EXISTS "Users can view own and public templates" ON public.personalization_templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON public.personalization_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.personalization_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON public.personalization_templates;

CREATE POLICY "Users can view own and public templates" ON public.personalization_templates FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR is_public = true);
CREATE POLICY "Users can insert own templates" ON public.personalization_templates FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own templates" ON public.personalization_templates FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own templates" ON public.personalization_templates FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));
