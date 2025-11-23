import React, { useState, useEffect } from 'react';
import {
  getAllRateLimits,
  getAPIQuotas,
  getAPIUsageLogs,
  getAPIUsageStats,
  getUserQueuedRequests,
  APIRateLimit,
  APIQuota,
  APIUsageLog,
  QueuedRequest
} from '../../services/apiUsageService';
import { apiQueue } from '../../services/apiQueueService';

export const APIUsageDashboard: React.FC = () => {
  const [rateLimits, setRateLimits] = useState<APIRateLimit[]>([]);
  const [quotas, setQuotas] = useState<APIQuota[]>([]);
  const [usageLogs, setUsageLogs] = useState<APIUsageLog[]>([]);
  const [queuedRequests, setQueuedRequests] = useState<QueuedRequest[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'limits' | 'quotas' | 'logs' | 'queue'>('overview');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [limits, quotaData, stats, queueStat, queued] = await Promise.all([
        getAllRateLimits(),
        getAPIQuotas(),
        getAPIUsageStats(),
        apiQueue.getQueueStatus(),
        getUserQueuedRequests()
      ]);

      setRateLimits(limits);
      setQuotas(quotaData);
      setUsageStats(stats);
      setQueueStatus(queueStat);
      setQueuedRequests(queued);

      if (activeTab === 'logs') {
        const logs = await getAPIUsageLogs(50, 0);
        setUsageLogs(logs);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load API usage data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">API Usage & Rate Limits</h2>
        <p className="text-gray-400">Monitor API quotas and manage rate limits</p>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'limits', label: 'Rate Limits', icon: '⚡' },
          { id: 'quotas', label: 'Quotas', icon: '📦' },
          { id: 'logs', label: 'Usage Logs', icon: '📋' },
          { id: 'queue', label: 'Request Queue', icon: '⏳' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-400">Loading...</div>
        </div>
      )}

      {!loading && (
        <>
          {activeTab === 'overview' && (
            <OverviewTab
              stats={usageStats}
              queueStatus={queueStatus}
              rateLimits={rateLimits}
              quotas={quotas}
            />
          )}
          {activeTab === 'limits' && <RateLimitsTab rateLimits={rateLimits} onRefresh={loadData} />}
          {activeTab === 'quotas' && <QuotasTab quotas={quotas} />}
          {activeTab === 'logs' && <UsageLogsTab logs={usageLogs} />}
          {activeTab === 'queue' && <QueueTab requests={queuedRequests} onRefresh={loadData} />}
        </>
      )}
    </div>
  );
};

const OverviewTab: React.FC<{
  stats: any;
  queueStatus: any;
  rateLimits: APIRateLimit[];
  quotas: APIQuota[];
}> = ({ stats, queueStatus, rateLimits, quotas }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Requests"
          value={stats?.total_requests || 0}
          icon="📡"
          color="blue"
        />
        <MetricCard
          title="Success Rate"
          value={stats?.total_requests > 0
            ? `${Math.round((stats.success_count / stats.total_requests) * 100)}%`
            : '0%'}
          subtitle={`${stats?.success_count || 0} successful`}
          icon="✅"
          color="green"
        />
        <MetricCard
          title="Rate Limited"
          value={stats?.rate_limited_count || 0}
          subtitle="Requests blocked"
          icon="🚫"
          color="orange"
        />
        <MetricCard
          title="Queued"
          value={queueStatus?.pending || 0}
          subtitle={`${queueStatus?.processing || 0} processing`}
          icon="⏳"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Active Rate Limits</h3>
          {rateLimits.filter(l => l.is_enabled).map(limit => {
            const dayPercent = (limit.current_day_count / limit.requests_per_day) * 100;
            return (
              <div key={limit.id} className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{limit.api_model}</span>
                  <span className="text-gray-400 text-sm">
                    {limit.current_day_count} / {limit.requests_per_day}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      dayPercent >= 90
                        ? 'bg-red-500'
                        : dayPercent >= 70
                        ? 'bg-orange-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(dayPercent, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Quota Status</h3>
          {quotas.filter(q => q.quota_type === 'daily').map(quota => {
            const percent = (quota.quota_used / quota.quota_limit) * 100;
            return (
              <div key={quota.id} className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{quota.api_model}</span>
                  <span className="text-gray-400 text-sm">
                    {quota.quota_used} / {quota.quota_limit}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      percent >= 90
                        ? 'bg-red-500'
                        : percent >= 70
                        ? 'bg-orange-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Resets: {new Date(quota.reset_at).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const RateLimitsTab: React.FC<{
  rateLimits: APIRateLimit[];
  onRefresh: () => void;
}> = ({ rateLimits, onRefresh }) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-900">
          <tr>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Model</th>
            <th className="text-center px-6 py-3 text-sm font-semibold text-gray-400">Per Minute</th>
            <th className="text-center px-6 py-3 text-sm font-semibold text-gray-400">Per Day</th>
            <th className="text-center px-6 py-3 text-sm font-semibold text-gray-400">Per Month</th>
            <th className="text-center px-6 py-3 text-sm font-semibold text-gray-400">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {rateLimits.map(limit => (
            <tr key={limit.id} className="hover:bg-gray-750 transition-colors">
              <td className="px-6 py-4 text-white font-medium">{limit.api_model}</td>
              <td className="px-6 py-4 text-center">
                <div className="text-white">{limit.current_minute_count} / {limit.requests_per_minute}</div>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="text-white">{limit.current_day_count} / {limit.requests_per_day}</div>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="text-white">{limit.current_month_count} / {limit.requests_per_month}</div>
              </td>
              <td className="px-6 py-4 text-center">
                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                  limit.is_enabled
                    ? 'bg-green-900/50 text-green-300'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {limit.is_enabled ? '✓ Enabled' : '○ Disabled'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const QuotasTab: React.FC<{ quotas: APIQuota[] }> = ({ quotas }) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-900">
          <tr>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Model</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Type</th>
            <th className="text-center px-6 py-3 text-sm font-semibold text-gray-400">Used / Limit</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Resets At</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {quotas.map(quota => (
            <tr key={quota.id} className="hover:bg-gray-750 transition-colors">
              <td className="px-6 py-4 text-white font-medium">{quota.api_model}</td>
              <td className="px-6 py-4 text-gray-300 capitalize">{quota.quota_type}</td>
              <td className="px-6 py-4 text-center">
                <div className="text-white">
                  {quota.quota_used} / {quota.quota_limit}
                </div>
                <div className="text-xs text-gray-500">
                  {Math.round((quota.quota_used / quota.quota_limit) * 100)}% used
                </div>
              </td>
              <td className="px-6 py-4 text-gray-300 text-sm">
                {new Date(quota.reset_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const UsageLogsTab: React.FC<{ logs: APIUsageLog[] }> = ({ logs }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-900/50 text-green-300 border-green-700';
      case 'error': return 'bg-red-900/50 text-red-300 border-red-700';
      case 'rate_limited': return 'bg-orange-900/50 text-orange-300 border-orange-700';
      case 'queued': return 'bg-blue-900/50 text-blue-300 border-blue-700';
      default: return 'bg-gray-700 text-gray-300 border-gray-600';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-900">
          <tr>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Time</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Model</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Request Type</th>
            <th className="text-center px-6 py-3 text-sm font-semibold text-gray-400">Status</th>
            <th className="text-center px-6 py-3 text-sm font-semibold text-gray-400">Response Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {logs.map(log => (
            <tr key={log.id} className="hover:bg-gray-750 transition-colors">
              <td className="px-6 py-4 text-gray-300 text-sm">
                {new Date(log.created_at).toLocaleString()}
              </td>
              <td className="px-6 py-4 text-white font-medium">{log.api_model}</td>
              <td className="px-6 py-4 text-gray-300">{log.request_type}</td>
              <td className="px-6 py-4 text-center">
                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(log.status)}`}>
                  {log.status.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 text-center text-gray-300">
                {log.response_time_ms ? `${log.response_time_ms}ms` : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const QueueTab: React.FC<{
  requests: QueuedRequest[];
  onRefresh: () => void;
}> = ({ requests, onRefresh }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-900/50 text-green-300';
      case 'failed': return 'bg-red-900/50 text-red-300';
      case 'processing': return 'bg-blue-900/50 text-blue-300';
      case 'pending': return 'bg-yellow-900/50 text-yellow-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-900">
          <tr>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Created</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Model</th>
            <th className="text-center px-6 py-3 text-sm font-semibold text-gray-400">Priority</th>
            <th className="text-center px-6 py-3 text-sm font-semibold text-gray-400">Status</th>
            <th className="text-center px-6 py-3 text-sm font-semibold text-gray-400">Retries</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {requests.map(req => (
            <tr key={req.id} className="hover:bg-gray-750 transition-colors">
              <td className="px-6 py-4 text-gray-300 text-sm">
                {new Date(req.created_at).toLocaleString()}
              </td>
              <td className="px-6 py-4 text-white font-medium">{req.api_model}</td>
              <td className="px-6 py-4 text-center text-gray-300">{req.priority}</td>
              <td className="px-6 py-4 text-center">
                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(req.status)}`}>
                  {req.status.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 text-center text-gray-300">{req.retry_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {requests.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No queued requests
        </div>
      )}
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
      {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
      <div className={`w-full h-1 bg-gradient-to-r ${colorClasses[color]} rounded-full mt-3`} />
    </div>
  );
};
