import { supabase } from '../lib/supabase';

export interface OnboardingProgress {
  user_id: string;
  tour_completed: boolean;
  current_step: number;
  features_discovered: string[];
  milestones_achieved: string[];
  skip_onboarding: boolean;
  last_tour_interaction: string;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  achievement_id: string;
  achievement_name: string;
  description: string;
  achieved_at: string;
  metadata?: any;
}

export const ACHIEVEMENTS = {
  FIRST_VIDEO: {
    id: 'first_video',
    name: 'First Video Created',
    description: 'You recorded your first video!'
  },
  FIRST_EMAIL: {
    id: 'first_email',
    name: 'First Email Sent',
    description: 'You sent your first personalized video email!'
  },
  AI_EXPLORER: {
    id: 'ai_explorer',
    name: 'AI Explorer',
    description: 'You used your first AI feature!'
  },
  CAMPAIGN_LAUNCHER: {
    id: 'campaign_launcher',
    name: 'Campaign Launcher',
    description: 'You created your first campaign!'
  },
  TEMPLATE_USER: {
    id: 'template_user',
    name: 'Template Master',
    description: 'You used a template to speed up your workflow!'
  },
  VIDEO_EDITOR: {
    id: 'video_editor',
    name: 'Video Editor',
    description: 'You edited your first video!'
  },
  TOUR_COMPLETE: {
    id: 'tour_complete',
    name: 'Quick Learner',
    description: 'You completed the onboarding tour!'
  },
  TEN_VIDEOS: {
    id: 'ten_videos',
    name: 'Video Producer',
    description: 'You created 10 videos!'
  },
  HUNDRED_EMAILS: {
    id: 'hundred_emails',
    name: 'Email Champion',
    description: 'You sent 100 personalized emails!'
  },
  SEO_OPTIMIZER: {
    id: 'seo_optimizer',
    name: 'SEO Optimizer',
    description: 'You optimized a video for SEO!'
  }
};

export async function getOnboardingProgress(): Promise<OnboardingProgress | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_onboarding_progress')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching onboarding progress:', error);
    return null;
  }

  return data;
}

export async function initializeOnboarding(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const existing = await getOnboardingProgress();
  if (existing) return;

  const { error } = await supabase
    .from('user_onboarding_progress')
    .insert({
      user_id: user.id,
      tour_completed: false,
      current_step: 0,
      features_discovered: [],
      milestones_achieved: [],
      skip_onboarding: false
    });

  if (error) {
    console.error('Error initializing onboarding:', error);
  }
}

export async function updateOnboardingStep(step: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('user_onboarding_progress')
    .update({
      current_step: step,
      last_tour_interaction: new Date().toISOString()
    })
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating onboarding step:', error);
  }
}

export async function completeTour(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('user_onboarding_progress')
    .update({
      tour_completed: true,
      current_step: 999
    })
    .eq('user_id', user.id);

  if (error) {
    console.error('Error completing tour:', error);
    return;
  }

  await unlockAchievement(ACHIEVEMENTS.TOUR_COMPLETE.id);
}

export async function skipOnboarding(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('user_onboarding_progress')
    .update({
      skip_onboarding: true
    })
    .eq('user_id', user.id);

  if (error) {
    console.error('Error skipping onboarding:', error);
  }
}

export async function markFeatureDiscovered(featureName: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error: upsertError } = await supabase
    .from('feature_discovery')
    .upsert({
      user_id: user.id,
      feature_name: featureName,
      discovered_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,feature_name'
    });

  if (upsertError) {
    console.error('Error marking feature discovered:', upsertError);
    return;
  }

  const progress = await getOnboardingProgress();
  if (progress && !progress.features_discovered.includes(featureName)) {
    const updatedFeatures = [...progress.features_discovered, featureName];

    const { error: updateError } = await supabase
      .from('user_onboarding_progress')
      .update({
        features_discovered: updatedFeatures
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating features discovered:', updateError);
    }
  }
}

export async function markFeatureUsed(featureName: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from('feature_discovery')
    .select('*')
    .eq('user_id', user.id)
    .eq('feature_name', featureName)
    .maybeSingle();

  if (!existing) {
    await markFeatureDiscovered(featureName);
  }

  const { error } = await supabase
    .from('feature_discovery')
    .update({
      first_use_at: existing?.first_use_at || new Date().toISOString(),
      use_count: (existing?.use_count || 0) + 1
    })
    .eq('user_id', user.id)
    .eq('feature_name', featureName);

  if (error) {
    console.error('Error marking feature used:', error);
  }
}

export async function logHelpInteraction(
  type: 'tooltip_view' | 'help_search' | 'tutorial_start' | 'tutorial_complete',
  featureContext?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('help_interactions')
    .insert({
      user_id: user.id,
      interaction_type: type,
      feature_context: featureContext
    });

  if (error) {
    console.error('Error logging help interaction:', error);
  }
}

export async function unlockAchievement(achievementId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const achievement = Object.values(ACHIEVEMENTS).find(a => a.id === achievementId);
  if (!achievement) return;

  const { error } = await supabase
    .from('user_achievements')
    .upsert({
      user_id: user.id,
      achievement_id: achievement.id,
      achievement_name: achievement.name,
      description: achievement.description,
      achieved_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,achievement_id',
      ignoreDuplicates: true
    });

  if (error) {
    console.error('Error unlocking achievement:', error);
  }
}

export async function getUserAchievements(): Promise<Achievement[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', user.id)
    .order('achieved_at', { ascending: false });

  if (error) {
    console.error('Error fetching achievements:', error);
    return [];
  }

  return data || [];
}

export async function getFeatureUsageStats(): Promise<Record<string, number>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const { data, error } = await supabase
    .from('feature_discovery')
    .select('feature_name, use_count')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching feature usage:', error);
    return {};
  }

  const stats: Record<string, number> = {};
  data?.forEach(item => {
    stats[item.feature_name] = item.use_count;
  });

  return stats;
}
