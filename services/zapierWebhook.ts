import { supabase } from '../lib/supabase';

export interface ZapierEventData {
  event: string;
  [key: string]: any;
}

export const triggerZapierWebhook = async (eventData: ZapierEventData): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('User not authenticated, skipping Zapier webhook');
      return false;
    }

    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('zapier_enabled, zapier_webhook_url')
      .eq('user_id', user.id)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      return false;
    }

    if (!settings || !settings.zapier_enabled || !settings.zapier_webhook_url) {
      console.log('Zapier webhook not configured or disabled');
      return false;
    }

    const response = await fetch(settings.zapier_webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...eventData,
        timestamp: new Date().toISOString(),
        user_id: user.id,
      }),
    });

    if (!response.ok) {
      console.error('Zapier webhook failed:', response.statusText);
      return false;
    }

    console.log('Zapier webhook triggered successfully');
    return true;
  } catch (error) {
    console.error('Error triggering Zapier webhook:', error);
    return false;
  }
};

export const triggerVideoCreatedEvent = async (videoData: {
  video_name: string;
  video_url: string;
  duration?: number;
  script?: string;
}) => {
  return triggerZapierWebhook({
    event: 'video_created',
    ...videoData,
  });
};

export const triggerEmailSentEvent = async (emailData: {
  to: string;
  subject: string;
  video_url?: string;
}) => {
  return triggerZapierWebhook({
    event: 'email_sent',
    ...emailData,
  });
};

export const triggerAIScenesGeneratedEvent = async (scenesData: {
  script: string;
  scene_count: number;
  visual_style: string;
}) => {
  return triggerZapierWebhook({
    event: 'ai_scenes_generated',
    ...scenesData,
  });
};
