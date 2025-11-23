import React, { useState, useEffect } from 'react';
import { getPlatformMetrics, PlatformMetrics } from '../../services/adminService';

export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPlatformMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-400">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Platform Analytics</h2>
          <p className="text-gray-400">Real-time platform metrics and insights</p>
        </div>
        <button
          onClick={loadMetrics}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Users"
          value={metrics?.total_users || 0}
          icon="👥"
          color="blue"
        />
        <MetricCard
          title="Active Today"
          value={metrics?.active_users_today || 0}
          subtitle={`${metrics?.active_users_week || 0} this week`}
          icon="✨"
          color="green"
        />
        <MetricCard
          title="Total Videos"
          value={metrics?.total_videos || 0}
          subtitle={`${metrics?.videos_today || 0} created today`}
          icon="🎥"
          color="purple"
        />
        <MetricCard
          title="Storage Used"
          value={`${metrics?.total_storage_gb || 0} GB`}
          subtitle={`${metrics?.avg_storage_per_user_mb?.toFixed(1) || 0} MB/user`}
          icon="💾"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Registered</span>
              <span className="text-2xl font-bold text-white">{metrics?.total_users || 0}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                style={{ width: '100%' }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Active Today</span>
              <span className="text-green-400 font-semibold">{metrics?.active_users_today || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Active This Week</span>
              <span className="text-blue-400 font-semibold">{metrics?.active_users_week || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Video Statistics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Videos</span>
              <span className="text-2xl font-bold text-white">{metrics?.total_videos || 0}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                style={{ width: '100%' }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Created Today</span>
              <span className="text-green-400 font-semibold">{metrics?.videos_today || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Avg per User</span>
              <span className="text-blue-400 font-semibold">
                {metrics && metrics.total_users > 0
                  ? (metrics.total_videos / metrics.total_users).toFixed(1)
                  : '0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Storage Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">Total Storage</p>
            <p className="text-3xl font-bold text-white">{metrics?.total_storage_gb?.toFixed(2) || 0}</p>
            <p className="text-gray-500 text-sm mt-1">GB</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">Average per User</p>
            <p className="text-3xl font-bold text-white">{metrics?.avg_storage_per_user_mb?.toFixed(1) || 0}</p>
            <p className="text-gray-500 text-sm mt-1">MB</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">Storage Efficiency</p>
            <p className="text-3xl font-bold text-green-400">Good</p>
            <p className="text-gray-500 text-sm mt-1">Optimized</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm font-medium">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      {subtitle && (
        <p className="text-sm text-gray-400">{subtitle}</p>
      )}
      <div className={`w-full h-1 bg-gradient-to-r ${colorClasses[color]} rounded-full mt-3`} />
    </div>
  );
};
