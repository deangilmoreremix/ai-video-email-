import React, { useState, useEffect } from 'react';
import {
  getAdminActivityLogs,
  getSecurityEvents,
  AdminActivityLog,
  SecurityEvent
} from '../../services/adminService';

export const SecurityMonitoring: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'activity' | 'security'>('activity');
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'activity') {
        const logs = await getAdminActivityLogs(50);
        setActivityLogs(logs);
      } else {
        const events = await getSecurityEvents(50);
        setSecurityEvents(events);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Security Monitoring</h2>
        <p className="text-gray-400">Track admin actions and security events</p>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'activity'
              ? 'bg-yellow-400 text-gray-900'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Admin Activity
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'security'
              ? 'bg-yellow-400 text-gray-900'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Security Events
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-400">Loading...</div>
        </div>
      ) : activeTab === 'activity' ? (
        <ActivityLogsTable logs={activityLogs} />
      ) : (
        <SecurityEventsTable events={securityEvents} />
      )}
    </div>
  );
};

interface ActivityLogsTableProps {
  logs: AdminActivityLog[];
}

const ActivityLogsTable: React.FC<ActivityLogsTableProps> = ({ logs }) => {
  const getActionIcon = (actionType: string) => {
    if (actionType.includes('delete')) return '🗑️';
    if (actionType.includes('update')) return '✏️';
    if (actionType.includes('create')) return '➕';
    return '📝';
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-900">
          <tr>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Action</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Target</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Details</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-750 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getActionIcon(log.action_type)}</span>
                  <span className="text-white font-medium">
                    {log.action_type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-gray-300">
                  {log.target_type || 'N/A'}
                  {log.target_id && (
                    <div className="text-xs text-gray-500">{log.target_id.substring(0, 8)}...</div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-gray-400 text-sm max-w-md truncate">
                  {JSON.stringify(log.details)}
                </div>
              </td>
              <td className="px-6 py-4 text-gray-300 text-sm">
                {new Date(log.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {logs.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No activity logs found
        </div>
      )}
    </div>
  );
};

interface SecurityEventsTableProps {
  events: SecurityEvent[];
}

const SecurityEventsTable: React.FC<SecurityEventsTableProps> = ({ events }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900/50 text-red-300 border-red-700';
      case 'high':
        return 'bg-orange-900/50 text-orange-300 border-orange-700';
      case 'medium':
        return 'bg-yellow-900/50 text-yellow-300 border-yellow-700';
      default:
        return 'bg-gray-700 text-gray-300 border-gray-600';
    }
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('failed_login')) return '🔒';
    if (eventType.includes('suspicious')) return '⚠️';
    if (eventType.includes('rate_limit')) return '🚫';
    return '🔔';
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-900">
          <tr>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Event</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Severity</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">IP Address</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Details</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {events.map((event) => (
            <tr key={event.id} className="hover:bg-gray-750 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getEventIcon(event.event_type)}</span>
                  <span className="text-white font-medium">
                    {event.event_type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(event.severity)}`}>
                  {event.severity.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 text-gray-300 font-mono text-sm">
                {event.ip_address || 'N/A'}
              </td>
              <td className="px-6 py-4">
                <div className="text-gray-400 text-sm max-w-md truncate">
                  {JSON.stringify(event.details)}
                </div>
              </td>
              <td className="px-6 py-4 text-gray-300 text-sm">
                {new Date(event.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {events.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No security events found
        </div>
      )}
    </div>
  );
};
