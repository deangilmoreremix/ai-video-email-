import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserVideo } from '../lib/supabase';

interface DashboardStats {
  totalVideos: number;
  totalEmails: number;
  avgEngagement: number;
  responseRate: number;
  videosThisWeek: number;
  emailsThisWeek: number;
}

interface QuickAction {
  icon: string;
  title: string;
  description: string;
  action: () => void;
  color: string;
}

interface DashboardOverviewProps {
  onNavigate: (section: 'create' | 'videos' | 'campaigns' | 'analytics') => void;
  onCreateVideo: () => void;
  onCreateCampaign: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigate,
  onCreateVideo,
  onCreateCampaign
}) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalVideos: 0,
    totalEmails: 0,
    avgEngagement: 0,
    responseRate: 0,
    videosThisWeek: 0,
    emailsThisWeek: 0
  });
  const [recentVideos, setRecentVideos] = useState<UserVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserName(user.email?.split('@')[0] || 'User');

      const { data: videos } = await supabase
        .from('user_videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6);

      setRecentVideos(videos || []);

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const videosThisWeek = (videos || []).filter(v =>
        new Date(v.created_at) > oneWeekAgo
      ).length;

      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', user.id);

      const { data: recipients } = await supabase
        .from('campaign_recipients')
        .select('sent_at, view_count, watch_duration')
        .in('campaign_id', (campaigns || []).map(c => c.id));

      const totalSent = (recipients || []).filter(r => r.sent_at).length;
      const totalViewed = (recipients || []).filter(r => r.view_count > 0).length;
      const responseRate = totalSent > 0 ? Math.round((totalViewed / totalSent) * 100) : 0;

      const recipientsThisWeek = (recipients || []).filter(r =>
        r.sent_at && new Date(r.sent_at) > oneWeekAgo
      ).length;

      const totalWatchTime = (recipients || []).reduce((sum, r) => sum + (r.watch_duration || 0), 0);
      const avgEngagement = totalViewed > 0
        ? Math.min(100, Math.round((totalWatchTime / totalViewed) / 60 * 10))
        : 0;

      setStats({
        totalVideos: videos?.length || 0,
        totalEmails: totalSent,
        avgEngagement,
        responseRate,
        videosThisWeek,
        emailsThisWeek: recipientsThisWeek
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      icon: '🎥',
      title: 'Create Video',
      description: 'Record or upload a new video',
      action: onCreateVideo,
      color: 'from-purple-600 to-blue-600'
    },
    {
      icon: '📧',
      title: 'Send Email',
      description: 'Compose and send a video email',
      action: onCreateVideo,
      color: 'from-blue-600 to-cyan-600'
    },
    {
      icon: '🚀',
      title: 'Create Campaign',
      description: 'Launch a multi-recipient campaign',
      action: onCreateCampaign,
      color: 'from-cyan-600 to-green-600'
    },
    {
      icon: '📊',
      title: 'View Analytics',
      description: 'Check your video performance',
      action: () => onNavigate('analytics'),
      color: 'from-green-600 to-yellow-600'
    }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="h-32 bg-gray-800 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/20 rounded-xl p-8 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {getGreeting()}, {userName}!
            </h1>
            <p className="text-gray-400">
              Here's what's happening with your videos today
            </p>
          </div>
          <button
            onClick={onCreateVideo}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Video
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            {stats.videosThisWeek > 0 && (
              <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded-full text-xs font-medium">
                +{stats.videosThisWeek} this week
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.totalVideos}</div>
          <div className="text-sm text-gray-400">Total Videos</div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            {stats.emailsThisWeek > 0 && (
              <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded-full text-xs font-medium">
                +{stats.emailsThisWeek} this week
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.totalEmails}</div>
          <div className="text-sm text-gray-400">Emails Sent</div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm hover:border-green-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.avgEngagement}%</div>
          <div className="text-sm text-gray-400">Avg. Engagement</div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm hover:border-yellow-500/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{stats.responseRate}%</div>
          <div className="text-sm text-gray-400">Response Rate</div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="group relative overflow-hidden bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-left hover:border-purple-500/50 transition-all hover:transform hover:scale-105"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
              <div className="relative z-10">
                <div className="text-4xl mb-3">{action.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-1">{action.title}</h3>
                <p className="text-sm text-gray-400">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {recentVideos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Recent Videos</h2>
            <button
              onClick={() => onNavigate('videos')}
              className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
            >
              View All →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentVideos.map((video) => (
              <div
                key={video.id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all group cursor-pointer"
              >
                <div className="aspect-video bg-gray-900 relative overflow-hidden">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.video_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all">
                      <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-1 truncate">{video.video_name}</h3>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{formatDate(video.created_at)}</span>
                    {video.duration && (
                      <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">Pro Tip: Use AI Writing Assistants</h3>
            <p className="text-gray-400 mb-4">
              Click the sparkle icon on any text field to get AI-powered suggestions, improvements, and transformations. Save time and create more engaging content!
            </p>
            <button
              onClick={() => onNavigate('create')}
              className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
            >
              Try it now →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
