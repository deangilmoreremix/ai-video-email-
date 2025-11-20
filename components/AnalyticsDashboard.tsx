import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface VideoAnalyticsSummary {
  video_id: string;
  video_name: string;
  created_at: string;
  total_views: number;
  unique_viewers: number;
  avg_watch_duration: number;
  avg_completion_rate: number;
  duration?: number;
}

interface AnalyticsDashboardProps {
  onClose: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onClose }) => {
  const [videos, setVideos] = useState<VideoAnalyticsSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoAnalyticsSummary | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userVideos, error: videosError } = await supabase
        .from('user_videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (videosError) throw videosError;

      const analyticsPromises = (userVideos || []).map(async (video) => {
        const { data: analytics } = await supabase.rpc('get_video_analytics_summary', {
          p_video_id: video.id
        });

        const summary = analytics?.[0] || {
          total_views: 0,
          unique_viewers: 0,
          avg_watch_duration: 0,
          avg_completion_rate: 0
        };

        return {
          video_id: video.id,
          video_name: video.video_name,
          created_at: video.created_at,
          duration: video.duration,
          total_views: Number(summary.total_views) || 0,
          unique_viewers: Number(summary.unique_viewers) || 0,
          avg_watch_duration: Number(summary.avg_watch_duration) || 0,
          avg_completion_rate: Number(summary.avg_completion_rate) || 0
        };
      });

      const results = await Promise.all(analyticsPromises);
      setVideos(results);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Video Analytics</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No videos with analytics yet.</p>
              <p className="text-sm mt-2">Send videos to start tracking performance.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {videos.map((video) => {
                const completionRate = Math.round(video.avg_completion_rate * 100);

                return (
                  <div
                    key={video.video_id}
                    className="bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-colors cursor-pointer"
                    onClick={() => setSelectedVideo(video)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{video.video_name}</h3>
                        <p className="text-sm text-gray-400">Sent {formatDate(video.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          completionRate >= 70 ? 'text-green-400' :
                          completionRate >= 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {completionRate}%
                        </div>
                        <div className="text-xs text-gray-400">completion</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-2xl font-bold text-white">{video.total_views}</div>
                        <div className="text-sm text-gray-400">Total Views</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">{video.unique_viewers}</div>
                        <div className="text-sm text-gray-400">Unique Viewers</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {formatDuration(video.avg_watch_duration)}
                        </div>
                        <div className="text-sm text-gray-400">Avg Watch Time</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {video.duration ? formatDuration(video.duration) : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-400">Duration</div>
                      </div>
                    </div>

                    {video.total_views > 0 && (
                      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                          </svg>
                          <div className="flex-1 text-sm text-blue-300">
                            <strong>AI Insight:</strong>{' '}
                            {completionRate >= 70
                              ? `Excellent performance! ${completionRate}% completion rate is above average.`
                              : completionRate >= 50
                              ? `Good engagement. Consider optimizing the middle section to improve completion rate.`
                              : `Low completion rate. Review the engagement prediction and consider re-recording.`}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
