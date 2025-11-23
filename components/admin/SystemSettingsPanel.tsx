import React, { useState, useEffect } from 'react';
import {
  getSystemSettings,
  getFeatureFlags,
  updateSystemSetting,
  updateFeatureFlag,
  SystemSetting,
  FeatureFlag
} from '../../services/adminService';

export const SystemSettingsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'settings' | 'features'>('settings');
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'settings') {
        const data = await getSystemSettings();
        setSettings(data);
      } else {
        const data = await getFeatureFlags();
        setFeatures(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (settingKey: string, newValue: any) => {
    try {
      setError(null);
      await updateSystemSetting(settingKey, newValue);
      setSuccess('Setting updated successfully');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update setting');
    }
  };

  const handleToggleFeature = async (featureName: string, currentStatus: boolean) => {
    try {
      setError(null);
      await updateFeatureFlag(featureName, { is_enabled: !currentStatus });
      setSuccess(`Feature ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update feature');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">System Settings</h2>
        <p className="text-gray-400">Configure platform settings and feature flags</p>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'settings'
              ? 'bg-yellow-400 text-gray-900'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          System Settings
        </button>
        <button
          onClick={() => setActiveTab('features')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'features'
              ? 'bg-yellow-400 text-gray-900'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Feature Flags
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-400">Loading...</div>
        </div>
      ) : activeTab === 'settings' ? (
        <SystemSettingsTable settings={settings} onUpdate={handleUpdateSetting} />
      ) : (
        <FeatureFlagsTable features={features} onToggle={handleToggleFeature} />
      )}
    </div>
  );
};

interface SystemSettingsTableProps {
  settings: SystemSetting[];
  onUpdate: (key: string, value: any) => void;
}

const SystemSettingsTable: React.FC<SystemSettingsTableProps> = ({ settings, onUpdate }) => {
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [editValue, setEditValue] = useState('');

  const categoryColors: Record<string, string> = {
    general: 'bg-blue-900/50 text-blue-300 border-blue-700',
    api: 'bg-purple-900/50 text-purple-300 border-purple-700',
    security: 'bg-red-900/50 text-red-300 border-red-700',
    features: 'bg-green-900/50 text-green-300 border-green-700',
    storage: 'bg-orange-900/50 text-orange-300 border-orange-700'
  };

  const handleEdit = (setting: SystemSetting) => {
    setEditingSetting(setting);
    setEditValue(JSON.stringify(setting.setting_value));
  };

  const handleSave = () => {
    if (!editingSetting) return;

    try {
      const parsed = JSON.parse(editValue);
      onUpdate(editingSetting.setting_key, parsed);
      setEditingSetting(null);
    } catch (err) {
      alert('Invalid JSON format');
    }
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedSettings).map(([category, categorySettings]) => (
        <div key={category} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="bg-gray-900 px-6 py-3">
            <h3 className="text-lg font-semibold text-white capitalize">{category} Settings</h3>
          </div>
          <div className="divide-y divide-gray-700">
            {categorySettings.map((setting) => (
              <div key={setting.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-white font-medium">{setting.setting_key}</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded border ${categoryColors[setting.category]}`}>
                        {setting.category}
                      </span>
                    </div>
                    {setting.description && (
                      <p className="text-sm text-gray-400 mb-2">{setting.description}</p>
                    )}
                    <div className="bg-gray-900 rounded p-3 font-mono text-sm text-gray-300">
                      {JSON.stringify(setting.setting_value, null, 2)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit(setting)}
                    className="ml-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {editingSetting && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Edit Setting</h3>
              <button
                onClick={() => setEditingSetting(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Setting Key</p>
                <p className="text-white font-medium">{editingSetting.setting_key}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Value (JSON format)</p>
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full h-48 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white font-mono text-sm focus:ring-2 focus:ring-yellow-400 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingSetting(null)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface FeatureFlagsTableProps {
  features: FeatureFlag[];
  onToggle: (featureName: string, currentStatus: boolean) => void;
}

const FeatureFlagsTable: React.FC<FeatureFlagsTableProps> = ({ features, onToggle }) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-900">
          <tr>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Feature</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Description</th>
            <th className="text-center px-6 py-3 text-sm font-semibold text-gray-400">Status</th>
            <th className="text-center px-6 py-3 text-sm font-semibold text-gray-400">Rollout</th>
            <th className="text-right px-6 py-3 text-sm font-semibold text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {features.map((feature) => (
            <tr key={feature.id} className="hover:bg-gray-750 transition-colors">
              <td className="px-6 py-4">
                <span className="text-white font-medium">
                  {feature.feature_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </td>
              <td className="px-6 py-4 text-gray-400 text-sm">
                {feature.description || 'No description'}
              </td>
              <td className="px-6 py-4 text-center">
                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                  feature.is_enabled
                    ? 'bg-green-900/50 text-green-300'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {feature.is_enabled ? '● Enabled' : '○ Disabled'}
                </span>
              </td>
              <td className="px-6 py-4 text-center text-gray-300">
                {feature.rollout_percentage}%
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onToggle(feature.feature_name, feature.is_enabled)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    feature.is_enabled
                      ? 'bg-red-700 text-white hover:bg-red-600'
                      : 'bg-green-700 text-white hover:bg-green-600'
                  }`}
                >
                  {feature.is_enabled ? 'Disable' : 'Enable'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {features.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No feature flags found
        </div>
      )}
    </div>
  );
};
