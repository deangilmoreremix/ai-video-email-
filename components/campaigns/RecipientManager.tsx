import React, { useState, useEffect } from 'react';
import { Campaign, CampaignRecipient, getRecipients, updateRecipient, getCampaignStats } from '../../services/campaignService';
import { BatchProcessor } from '../../services/batchProcessingService';
import { getStatusColor, getStatusLabel, formatCost, calculateEngagementScore } from '../../lib/campaignUtils';

interface RecipientManagerProps {
  campaign: Campaign;
  onBack: () => void;
}

export const RecipientManager: React.FC<RecipientManagerProps> = ({ campaign, onBack }) => {
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [selectedStatus, setSelectedStatus] = useState<CampaignRecipient['status'] | 'all'>('all');

  useEffect(() => {
    loadRecipients();
  }, [campaign.id]);

  const loadRecipients = async () => {
    try {
      setLoading(true);
      const data = await getRecipients(campaign.id);
      setRecipients(data);
    } catch (err) {
      console.error('Failed to load recipients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessCampaign = async () => {
    const pendingRecipients = recipients.filter(r => r.status === 'pending');
    if (pendingRecipients.length === 0) return;

    setProcessing(true);

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
      if (!apiKey) throw new Error('API key not configured');

      const processor = new BatchProcessor(apiKey);

      await processor.processBatch({
        campaignId: campaign.id,
        recipients: pendingRecipients,
        tier: campaign.personalization_tier,
        scriptTemplate: campaign.template_script,
        visualStyle: campaign.visual_style,
        onProgress: (p) => {
          setProgress({ completed: p.completed, total: p.total });
        },
        onRecipientComplete: () => {
          loadRecipients();
        },
      });
    } catch (err) {
      console.error('Processing failed:', err);
    } finally {
      setProcessing(false);
    }
  };

  const filteredRecipients = selectedStatus === 'all'
    ? recipients
    : recipients.filter(r => r.status === selectedStatus);

  const statusCounts = recipients.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={onBack} className="text-blue-600 hover:underline mb-2">← Back to Campaigns</button>
          <h1 className="text-3xl font-bold">{campaign.campaign_name}</h1>
        </div>
        <button
          onClick={handleProcessCampaign}
          disabled={processing || recipients.filter(r => r.status === 'pending').length === 0}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {processing ? `Processing ${progress.completed}/${progress.total}...` : 'Process Campaign'}
        </button>
      </div>

      <div className="grid grid-cols-6 gap-4">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`p-4 rounded-lg ${selectedStatus === 'all' ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border'}`}
        >
          <div className="text-2xl font-bold">{recipients.length}</div>
          <div className="text-sm text-gray-600">All</div>
        </button>

        {(['pending', 'processing', 'ready', 'sent', 'viewed', 'failed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`p-4 rounded-lg ${selectedStatus === status ? 'border-2' : 'bg-white border'}`}
            style={{
              borderColor: selectedStatus === status ? getStatusColor(status) : undefined,
              backgroundColor: selectedStatus === status ? `${getStatusColor(status)}10` : undefined,
            }}
          >
            <div className="text-2xl font-bold">{statusCounts[status] || 0}</div>
            <div className="text-sm text-gray-600">{getStatusLabel(status)}</div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engagement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRecipients.map((recipient) => {
                const engagementScore = calculateEngagementScore(recipient);

                return (
                  <tr key={recipient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{recipient.recipient_name}</div>
                      {recipient.role && <div className="text-sm text-gray-500">{recipient.role}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{recipient.recipient_email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{recipient.company || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${getStatusColor(recipient.status)}20`,
                          color: getStatusColor(recipient.status),
                        }}
                      >
                        {getStatusLabel(recipient.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${engagementScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{engagementScore}%</span>
                      </div>
                      {recipient.view_count > 0 && (
                        <div className="text-xs text-gray-500 mt-1">{recipient.view_count} views</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {formatCost(Number(recipient.generation_cost) || 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRecipients.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No recipients found with status: {selectedStatus === 'all' ? 'all' : getStatusLabel(selectedStatus)}
          </div>
        )}
      </div>
    </div>
  );
};
