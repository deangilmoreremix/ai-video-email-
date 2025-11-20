import React, { useState, useEffect } from 'react';
import { supabase, UserSettings } from '../lib/supabase';

interface SettingsProps {
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<Partial<UserSettings>>({
    email_api_provider: 'mailto',
    zapier_enabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Please sign in to manage settings');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setSettings(data);
      }
    } catch (err: any) {
      console.error('Error loading settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Please sign in to save settings');
      }

      const settingsData = {
        ...settings,
        user_id: user.id,
      };

      const { error: upsertError } = await supabase
        .from('user_settings')
        .upsert(settingsData, { onConflict: 'user_id' });

      if (upsertError) throw upsertError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-8 rounded-lg max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-gray-800 p-8 rounded-lg max-w-2xl w-full mx-4 my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-lg mb-4">
            Settings saved successfully!
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Email Configuration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Provider</label>
                <select
                  value={settings.email_api_provider || 'mailto'}
                  onChange={(e) => setSettings({ ...settings, email_api_provider: e.target.value as any })}
                  className="w-full bg-gray-900 p-2 rounded-lg border border-gray-600 focus:ring-yellow-500"
                >
                  <option value="mailto">Default (mailto link)</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="resend">Resend</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="smtp">Custom SMTP</option>
                </select>
              </div>

              {settings.email_api_provider !== 'mailto' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">From Email Address</label>
                    <input
                      type="email"
                      value={settings.email_from_address || ''}
                      onChange={(e) => setSettings({ ...settings, email_from_address: e.target.value })}
                      className="w-full bg-gray-900 p-2 rounded-lg border border-gray-600 focus:ring-yellow-500"
                      placeholder="noreply@yourdomain.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">From Name</label>
                    <input
                      type="text"
                      value={settings.email_from_name || ''}
                      onChange={(e) => setSettings({ ...settings, email_from_name: e.target.value })}
                      className="w-full bg-gray-900 p-2 rounded-lg border border-gray-600 focus:ring-yellow-500"
                      placeholder="Your Name"
                    />
                  </div>
                </>
              )}

              {settings.email_api_provider === 'smtp' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">SMTP Host</label>
                    <input
                      type="text"
                      value={settings.smtp_host || ''}
                      onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                      className="w-full bg-gray-900 p-2 rounded-lg border border-gray-600 focus:ring-yellow-500"
                      placeholder="smtp.example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">SMTP Port</label>
                    <input
                      type="number"
                      value={settings.smtp_port || 587}
                      onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) })}
                      className="w-full bg-gray-900 p-2 rounded-lg border border-gray-600 focus:ring-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">SMTP Username</label>
                    <input
                      type="text"
                      value={settings.smtp_username || ''}
                      onChange={(e) => setSettings({ ...settings, smtp_username: e.target.value })}
                      className="w-full bg-gray-900 p-2 rounded-lg border border-gray-600 focus:ring-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">SMTP Password</label>
                    <input
                      type="password"
                      value={settings.smtp_password || ''}
                      onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                      className="w-full bg-gray-900 p-2 rounded-lg border border-gray-600 focus:ring-yellow-500"
                    />
                  </div>
                </>
              ) : settings.email_api_provider !== 'mailto' && (
                <div>
                  <label className="block text-sm font-medium mb-2">API Key</label>
                  <input
                    type="password"
                    value={settings.email_api_key || ''}
                    onChange={(e) => setSettings({ ...settings, email_api_key: e.target.value })}
                    className="w-full bg-gray-900 p-2 rounded-lg border border-gray-600 focus:ring-yellow-500"
                    placeholder="Enter your API key"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold mb-4">Zapier Integration</h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="zapier-enabled"
                  checked={settings.zapier_enabled || false}
                  onChange={(e) => setSettings({ ...settings, zapier_enabled: e.target.checked })}
                  className="w-5 h-5 bg-gray-900 border-gray-600 rounded focus:ring-yellow-500"
                />
                <label htmlFor="zapier-enabled" className="text-sm font-medium">
                  Enable Zapier Integration
                </label>
              </div>

              {settings.zapier_enabled && (
                <div>
                  <label className="block text-sm font-medium mb-2">Zapier Webhook URL</label>
                  <input
                    type="url"
                    value={settings.zapier_webhook_url || ''}
                    onChange={(e) => setSettings({ ...settings, zapier_webhook_url: e.target.value })}
                    className="w-full bg-gray-900 p-2 rounded-lg border border-gray-600 focus:ring-yellow-500"
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    This webhook will be triggered when you send videos or generate AI scenes.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 rounded-lg hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
