import { supabase } from '../lib/supabase';

export interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  role: 'user' | 'admin' | 'super_admin';
  video_count?: number;
  storage_used_mb?: number;
}

export interface AdminActivityLog {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_type?: string;
  target_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface AdminNotification {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_read: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  category: 'general' | 'api' | 'security' | 'features' | 'storage';
  description?: string;
  updated_by?: string;
  updated_at: string;
}

export interface FeatureFlag {
  id: string;
  feature_name: string;
  is_enabled: boolean;
  rollout_percentage: number;
  allowed_user_ids: string[];
  description?: string;
  updated_by?: string;
  updated_at: string;
}

export interface PlatformMetrics {
  total_users: number;
  active_users_today: number;
  active_users_week: number;
  total_videos: number;
  videos_today: number;
  total_storage_gb: number;
  avg_storage_per_user_mb: number;
}

export interface SecurityEvent {
  id: string;
  event_type: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

export const checkIsSuperAdmin = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return false;
    return data.role === 'super_admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export const logAdminActivity = async (
  actionType: string,
  targetType?: string,
  targetId?: string,
  details: Record<string, any> = {}
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('admin_activity_logs')
      .insert({
        action_type: actionType,
        target_type: targetType,
        target_id: targetId,
        details
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error logging admin activity:', error);
  }
};

export const getAllUsers = async (limit = 100, offset = 0): Promise<UserWithRole[]> => {
  try {
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({
      page: Math.floor(offset / limit) + 1,
      perPage: limit
    });

    if (usersError) throw usersError;

    const userIds = usersData.users.map(u => u.id);

    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds);

    const { data: videoCounts } = await supabase
      .from('user_videos')
      .select('user_id')
      .in('user_id', userIds);

    const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
    const videoCountMap = new Map<string, number>();
    videoCounts?.forEach(v => {
      videoCountMap.set(v.user_id, (videoCountMap.get(v.user_id) || 0) + 1);
    });

    return usersData.users.map(user => ({
      id: user.id,
      email: user.email || '',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at || '',
      role: rolesMap.get(user.id) || 'user',
      video_count: videoCountMap.get(user.id) || 0,
      storage_used_mb: 0
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const searchUsers = async (query: string): Promise<UserWithRole[]> => {
  try {
    const allUsers = await getAllUsers(1000, 0);
    return allUsers.filter(user =>
      user.email.toLowerCase().includes(query.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

export const updateUserRole = async (userId: string, newRole: 'user' | 'admin' | 'super_admin'): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) throw error;

    await logAdminActivity('update_user_role', 'user', userId, { new_role: newRole });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;

    await logAdminActivity('delete_user', 'user', userId);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const getPlatformMetrics = async (): Promise<PlatformMetrics> => {
  try {
    const { count: totalUsers } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: usersData } = await supabase.auth.admin.listUsers();
    const activeToday = usersData?.users.filter(u =>
      u.last_sign_in_at && new Date(u.last_sign_in_at) >= today
    ).length || 0;

    const activeWeek = usersData?.users.filter(u =>
      u.last_sign_in_at && new Date(u.last_sign_in_at) >= weekAgo
    ).length || 0;

    const { count: totalVideos } = await supabase
      .from('user_videos')
      .select('*', { count: 'exact', head: true });

    const { count: videosToday } = await supabase
      .from('user_videos')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    const { data: videoSizes } = await supabase
      .from('user_videos')
      .select('file_size');

    const totalStorageBytes = videoSizes?.reduce((sum, v) => sum + (v.file_size || 0), 0) || 0;
    const totalStorageGB = totalStorageBytes / (1024 * 1024 * 1024);
    const avgStorageMB = totalUsers ? (totalStorageBytes / totalUsers) / (1024 * 1024) : 0;

    return {
      total_users: totalUsers || 0,
      active_users_today: activeToday,
      active_users_week: activeWeek,
      total_videos: totalVideos || 0,
      videos_today: videosToday || 0,
      total_storage_gb: parseFloat(totalStorageGB.toFixed(2)),
      avg_storage_per_user_mb: parseFloat(avgStorageMB.toFixed(2))
    };
  } catch (error) {
    console.error('Error fetching platform metrics:', error);
    throw error;
  }
};

export const getAdminActivityLogs = async (limit = 50): Promise<AdminActivityLog[]> => {
  try {
    const { data, error } = await supabase
      .from('admin_activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
};

export const getAdminNotifications = async (): Promise<AdminNotification[]> => {
  try {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const getSystemSettings = async (): Promise<SystemSetting[]> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching system settings:', error);
    throw error;
  }
};

export const updateSystemSetting = async (settingKey: string, settingValue: any): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('system_settings')
      .update({
        setting_value: settingValue,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', settingKey);

    if (error) throw error;

    await logAdminActivity('update_system_setting', 'system_setting', undefined, {
      setting_key: settingKey,
      new_value: settingValue
    });
  } catch (error) {
    console.error('Error updating system setting:', error);
    throw error;
  }
};

export const getFeatureFlags = async (): Promise<FeatureFlag[]> => {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('feature_name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    throw error;
  }
};

export const updateFeatureFlag = async (
  featureName: string,
  updates: Partial<FeatureFlag>
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('feature_flags')
      .update({
        ...updates,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('feature_name', featureName);

    if (error) throw error;

    await logAdminActivity('update_feature_flag', 'feature_flag', undefined, {
      feature_name: featureName,
      updates
    });
  } catch (error) {
    console.error('Error updating feature flag:', error);
    throw error;
  }
};

export const getSecurityEvents = async (limit = 50): Promise<SecurityEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('security_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching security events:', error);
    throw error;
  }
};

export const getAllVideos = async (limit = 100, offset = 0) => {
  try {
    const { data, error } = await supabase
      .from('user_videos')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw error;
  }
};

export const deleteVideo = async (videoId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_videos')
      .delete()
      .eq('id', videoId);

    if (error) throw error;

    await logAdminActivity('delete_video', 'video', videoId);
  } catch (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
};
