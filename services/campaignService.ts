import { supabase } from '../lib/supabase';

export interface Campaign {
  id: string;
  user_id: string;
  campaign_name: string;
  master_video_id?: string;
  master_video_url?: string;
  template_script: string;
  personalization_fields: string[];
  personalization_tier: 'basic' | 'smart' | 'advanced';
  visual_style: string;
  status: 'draft' | 'processing' | 'ready' | 'completed' | 'failed';
  use_case: 'cold_outreach' | 'abm' | 'onboarding' | 'follow_up';
  created_at: string;
  updated_at: string;
}

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  recipient_name: string;
  recipient_email: string;
  company?: string;
  role?: string;
  industry?: string;
  pain_point?: string;
  custom_fields: Record<string, any>;
  personalized_video_url?: string;
  thumbnail_url?: string;
  status: 'pending' | 'processing' | 'ready' | 'sent' | 'viewed' | 'failed';
  generation_cost: number;
  processing_time_ms: number;
  created_at: string;
  sent_at?: string;
  viewed_at?: string;
  view_count: number;
  watch_duration: number;
}

export interface CampaignStats {
  total_recipients: number;
  videos_generated: number;
  videos_sent: number;
  videos_viewed: number;
  total_cost: number;
  avg_watch_time: number;
  completion_rate: number;
}

export const createCampaign = async (campaignData: Partial<Campaign>): Promise<Campaign> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      user_id: user.id,
      ...campaignData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCampaign = async (
  campaignId: string,
  updates: Partial<Campaign>
): Promise<Campaign> => {
  const { data, error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', campaignId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getCampaign = async (campaignId: string): Promise<Campaign> => {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (error) throw error;
  return data;
};

export const listCampaigns = async (): Promise<Campaign[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const deleteCampaign = async (campaignId: string): Promise<void> => {
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId);

  if (error) throw error;
};

export const addRecipients = async (
  campaignId: string,
  recipients: Partial<CampaignRecipient>[]
): Promise<CampaignRecipient[]> => {
  const recipientsWithCampaign = recipients.map(r => ({
    campaign_id: campaignId,
    ...r,
  }));

  const { data, error } = await supabase
    .from('campaign_recipients')
    .insert(recipientsWithCampaign)
    .select();

  if (error) throw error;
  return data || [];
};

export const updateRecipient = async (
  recipientId: string,
  updates: Partial<CampaignRecipient>
): Promise<CampaignRecipient> => {
  const { data, error } = await supabase
    .from('campaign_recipients')
    .update(updates)
    .eq('id', recipientId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getRecipients = async (campaignId: string): Promise<CampaignRecipient[]> => {
  const { data, error } = await supabase
    .from('campaign_recipients')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const deleteRecipient = async (recipientId: string): Promise<void> => {
  const { error } = await supabase
    .from('campaign_recipients')
    .delete()
    .eq('id', recipientId);

  if (error) throw error;
};

export const getCampaignStats = async (campaignId: string): Promise<CampaignStats> => {
  const recipients = await getRecipients(campaignId);

  const stats: CampaignStats = {
    total_recipients: recipients.length,
    videos_generated: recipients.filter(r => r.status !== 'pending' && r.status !== 'failed').length,
    videos_sent: recipients.filter(r => r.status === 'sent' || r.status === 'viewed').length,
    videos_viewed: recipients.filter(r => r.status === 'viewed').length,
    total_cost: recipients.reduce((sum, r) => sum + Number(r.generation_cost || 0), 0),
    avg_watch_time: recipients.length > 0
      ? recipients.reduce((sum, r) => sum + (r.watch_duration || 0), 0) / recipients.length
      : 0,
    completion_rate: recipients.length > 0
      ? (recipients.filter(r => r.status === 'ready' || r.status === 'sent' || r.status === 'viewed').length / recipients.length) * 100
      : 0,
  };

  return stats;
};

export const updateCampaignAnalytics = async (campaignId: string): Promise<void> => {
  const stats = await getCampaignStats(campaignId);

  const { error } = await supabase
    .from('campaign_analytics')
    .upsert({
      campaign_id: campaignId,
      total_recipients: stats.total_recipients,
      videos_generated: stats.videos_generated,
      videos_sent: stats.videos_sent,
      total_views: stats.videos_viewed,
      avg_watch_time: stats.avg_watch_time,
      completion_rate: stats.completion_rate,
      total_cost: stats.total_cost,
      cost_per_view: stats.videos_viewed > 0 ? stats.total_cost / stats.videos_viewed : 0,
    });

  if (error) throw error;
};

export const getTierCost = (tier: 'basic' | 'smart' | 'advanced'): number => {
  const costs = {
    basic: 0.02,
    smart: 0.05,
    advanced: 0.15,
  };
  return costs[tier];
};

export const calculateEstimatedCost = (recipientCount: number, tier: 'basic' | 'smart' | 'advanced'): number => {
  return recipientCount * getTierCost(tier);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const parseCSV = (csvText: string): Partial<CampaignRecipient>[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const recipients: Partial<CampaignRecipient>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const recipient: Partial<CampaignRecipient> = {
      custom_fields: {},
    };

    headers.forEach((header, index) => {
      const value = values[index];
      if (!value) return;

      switch (header) {
        case 'name':
        case 'recipient_name':
        case 'first_name':
          recipient.recipient_name = value;
          break;
        case 'email':
        case 'recipient_email':
          recipient.recipient_email = value;
          break;
        case 'company':
          recipient.company = value;
          break;
        case 'role':
        case 'title':
        case 'job_title':
          recipient.role = value;
          break;
        case 'industry':
          recipient.industry = value;
          break;
        case 'pain_point':
        case 'pain point':
        case 'challenge':
          recipient.pain_point = value;
          break;
        default:
          if (recipient.custom_fields) {
            recipient.custom_fields[header] = value;
          }
      }
    });

    if (recipient.recipient_email && validateEmail(recipient.recipient_email)) {
      recipients.push(recipient);
    }
  }

  return recipients;
};

export const generateCSVTemplate = (): string => {
  return 'name,email,company,role,industry,pain_point\nJohn Doe,john@example.com,Acme Corp,CEO,Technology,Scaling operations\n';
};
