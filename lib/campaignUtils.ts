import { Campaign, CampaignRecipient } from '../services/campaignService';

export const formatCost = (cost: number): string => {
  return `$${cost.toFixed(2)}`;
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const getStatusColor = (status: Campaign['status'] | CampaignRecipient['status']): string => {
  const colors: Record<string, string> = {
    draft: '#9CA3AF',
    pending: '#FCD34D',
    processing: '#60A5FA',
    ready: '#34D399',
    completed: '#10B981',
    sent: '#8B5CF6',
    viewed: '#EC4899',
    failed: '#EF4444',
    paused: '#F59E0B',
  };
  return colors[status] || '#6B7280';
};

export const getStatusLabel = (status: Campaign['status'] | CampaignRecipient['status']): string => {
  const labels: Record<string, string> = {
    draft: 'Draft',
    pending: 'Pending',
    processing: 'Processing',
    ready: 'Ready',
    completed: 'Completed',
    sent: 'Sent',
    viewed: 'Viewed',
    failed: 'Failed',
    paused: 'Paused',
  };
  return labels[status] || status;
};

export const getTierLabel = (tier: 'basic' | 'smart' | 'advanced'): string => {
  const labels = {
    basic: 'Basic',
    smart: 'Smart',
    advanced: 'Advanced',
  };
  return labels[tier];
};

export const getTierDescription = (tier: 'basic' | 'smart' | 'advanced'): string => {
  const descriptions = {
    basic: 'Text overlays, personalized thumbnails, and custom email subjects',
    smart: 'All Basic features plus industry visuals, role-based messaging, and company research',
    advanced: 'All Smart features plus dynamic backgrounds, deep research, and multi-language support',
  };
  return descriptions[tier];
};

export const getTierColor = (tier: 'basic' | 'smart' | 'advanced'): string => {
  const colors = {
    basic: '#3B82F6',
    smart: '#8B5CF6',
    advanced: '#EC4899',
  };
  return colors[tier];
};

export const validateRecipientData = (recipient: Partial<CampaignRecipient>): string[] => {
  const errors: string[] = [];

  if (!recipient.recipient_email) {
    errors.push('Email is required');
  } else if (!isValidEmail(recipient.recipient_email)) {
    errors.push('Invalid email format');
  }

  if (!recipient.recipient_name || !recipient.recipient_name.trim()) {
    errors.push('Name is required');
  }

  return errors;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const detectDuplicateEmails = (recipients: Partial<CampaignRecipient>[]): string[] => {
  const emailCounts = new Map<string, number>();
  const duplicates: string[] = [];

  recipients.forEach(recipient => {
    if (recipient.recipient_email) {
      const email = recipient.recipient_email.toLowerCase();
      const count = emailCounts.get(email) || 0;
      emailCounts.set(email, count + 1);

      if (count === 1) {
        duplicates.push(recipient.recipient_email);
      }
    }
  });

  return duplicates;
};

export const calculateEngagementScore = (recipient: CampaignRecipient): number => {
  let score = 0;

  if (recipient.status === 'viewed') score += 40;
  else if (recipient.status === 'sent') score += 20;
  else if (recipient.status === 'ready') score += 10;

  if (recipient.view_count > 0) {
    score += Math.min(recipient.view_count * 10, 30);
  }

  if (recipient.watch_duration > 0) {
    const watchPercentage = (recipient.watch_duration / 60) * 100;
    score += Math.min(watchPercentage, 30);
  }

  return Math.min(score, 100);
};

export const calculateCampaignHealth = (recipients: CampaignRecipient[]): {
  health: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  issues: string[];
} => {
  if (recipients.length === 0) {
    return { health: 'poor', score: 0, issues: ['No recipients added'] };
  }

  const issues: string[] = [];
  let score = 100;

  const failedCount = recipients.filter(r => r.status === 'failed').length;
  const failureRate = (failedCount / recipients.length) * 100;

  if (failureRate > 20) {
    score -= 30;
    issues.push(`High failure rate: ${failureRate.toFixed(1)}%`);
  } else if (failureRate > 10) {
    score -= 15;
    issues.push(`Moderate failure rate: ${failureRate.toFixed(1)}%`);
  }

  const viewedCount = recipients.filter(r => r.status === 'viewed').length;
  const sentCount = recipients.filter(r => r.status === 'sent' || r.status === 'viewed').length;
  const viewRate = sentCount > 0 ? (viewedCount / sentCount) * 100 : 0;

  if (sentCount > 0 && viewRate < 20) {
    score -= 20;
    issues.push(`Low view rate: ${viewRate.toFixed(1)}%`);
  }

  const totalEngagement = recipients.reduce((sum, r) => sum + calculateEngagementScore(r), 0);
  const avgEngagement = recipients.length > 0 ? totalEngagement / recipients.length : 0;

  if (avgEngagement < 30) {
    score -= 20;
    issues.push('Low overall engagement');
  }

  let health: 'excellent' | 'good' | 'fair' | 'poor';
  if (score >= 80) health = 'excellent';
  else if (score >= 60) health = 'good';
  else if (score >= 40) health = 'fair';
  else health = 'poor';

  return { health, score: Math.max(0, score), issues };
};

export const groupRecipientsByStatus = (recipients: CampaignRecipient[]): Record<string, CampaignRecipient[]> => {
  return recipients.reduce((groups, recipient) => {
    const status = recipient.status;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(recipient);
    return groups;
  }, {} as Record<string, CampaignRecipient[]>);
};

export const sortRecipients = (
  recipients: CampaignRecipient[],
  sortBy: 'name' | 'email' | 'company' | 'status' | 'created_at' | 'engagement',
  order: 'asc' | 'desc' = 'asc'
): CampaignRecipient[] => {
  const sorted = [...recipients].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = (a.recipient_name || '').localeCompare(b.recipient_name || '');
        break;
      case 'email':
        comparison = a.recipient_email.localeCompare(b.recipient_email);
        break;
      case 'company':
        comparison = (a.company || '').localeCompare(b.company || '');
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'engagement':
        comparison = calculateEngagementScore(a) - calculateEngagementScore(b);
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
};

export const filterRecipients = (
  recipients: CampaignRecipient[],
  filters: {
    status?: CampaignRecipient['status'][];
    search?: string;
    company?: string;
    industry?: string;
  }
): CampaignRecipient[] => {
  return recipients.filter(recipient => {
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(recipient.status)) {
        return false;
      }
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesName = recipient.recipient_name?.toLowerCase().includes(searchLower);
      const matchesEmail = recipient.recipient_email.toLowerCase().includes(searchLower);
      const matchesCompany = recipient.company?.toLowerCase().includes(searchLower);

      if (!matchesName && !matchesEmail && !matchesCompany) {
        return false;
      }
    }

    if (filters.company && recipient.company !== filters.company) {
      return false;
    }

    if (filters.industry && recipient.industry !== filters.industry) {
      return false;
    }

    return true;
  });
};
