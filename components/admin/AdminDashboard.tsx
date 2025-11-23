import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { UserManagement } from './UserManagement';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { SecurityMonitoring } from './SecurityMonitoring';
import { SystemSettingsPanel } from './SystemSettingsPanel';
import { Loader } from '../Loader';

type AdminTab = 'overview' | 'users' | 'analytics' | 'security' | 'settings';

interface AdminDashboardProps {
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const { isAdmin, loading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
        <Loader />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-red-700 rounded-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
          <p className="text-gray-300 mb-6">
            You do not have permission to access the admin dashboard.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 overflow-hidden flex flex-col">
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-yellow-400">Super Admin Dashboard</h1>
          <span className="px-3 py-1 bg-red-900/50 text-red-300 text-xs font-semibold rounded-full border border-red-700">
            ADMIN ACCESS
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-2xl transition-colors"
          title="Close Admin Dashboard"
        >
          ×
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          <nav className="flex-1 p-4 space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-yellow-400 text-gray-900'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-700">
            <div className="bg-gray-900 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Admin Status</p>
              <p className="text-sm font-semibold text-green-400">● Active</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-900">
          {activeTab === 'overview' && <OverviewDashboard />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'security' && <SecurityMonitoring />}
          {activeTab === 'settings' && <SystemSettingsPanel />}
        </div>
      </div>
    </div>
  );
};

const OverviewDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Platform Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Users</span>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-3xl font-bold text-white">-</p>
          <p className="text-xs text-green-400 mt-2">View in Analytics</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Videos</span>
            <span className="text-2xl">🎥</span>
          </div>
          <p className="text-3xl font-bold text-white">-</p>
          <p className="text-xs text-green-400 mt-2">View in Analytics</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Storage Used</span>
            <span className="text-2xl">💾</span>
          </div>
          <p className="text-3xl font-bold text-white">-</p>
          <p className="text-xs text-green-400 mt-2">View in Analytics</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Active Today</span>
            <span className="text-2xl">✨</span>
          </div>
          <p className="text-3xl font-bold text-white">-</p>
          <p className="text-xs text-green-400 mt-2">View in Analytics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-left flex items-center justify-between">
              <span>View All Users</span>
              <span>→</span>
            </button>
            <button className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-left flex items-center justify-between">
              <span>Review Security Events</span>
              <span>→</span>
            </button>
            <button className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-left flex items-center justify-between">
              <span>Manage Feature Flags</span>
              <span>→</span>
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Database</span>
              <span className="text-green-400 font-semibold">● Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">API Services</span>
              <span className="text-green-400 font-semibold">● Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Storage</span>
              <span className="text-green-400 font-semibold">● Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Maintenance Mode</span>
              <span className="text-gray-400 font-semibold">○ Disabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
