import React, { useState, useEffect } from 'react';
import { Campaign, listCampaigns, getCampaignStats, CampaignStats } from '../../services/campaignService';
import { getStatusColor, getStatusLabel, formatCost, formatPercentage, getTierLabel } from '../../lib/campaignUtils';

interface CampaignDashboardProps {
  onCreateNew: () => void;
  onSelectCampaign: (campaign: Campaign) => void;
}

export const CampaignDashboard: React.FC<CampaignDashboardProps> = ({ onCreateNew, onSelectCampaign }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignStats, setCampaignStats] = useState<Record<string, CampaignStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Campaign['status'] | 'all'>('all');

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await listCampaigns();
      setCampaigns(data);

      const statsMap: Record<string, CampaignStats> = {};
      for (const campaign of data) {
        try {
          const stats = await getCampaignStats(campaign.id);
          statsMap[campaign.id] = stats;
        } catch (err) {
          console.error(`Failed to load stats for campaign ${campaign.id}`, err);
        }
      }
      setCampaignStats(statsMap);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = filter === 'all'
    ? campaigns
    : campaigns.filter(c => c.status === filter);

  const totalStats = campaigns.reduce((acc, campaign) => {
    const stats = campaignStats[campaign.id];
    if (!stats) return acc;

    return {
      total_recipients: acc.total_recipients + stats.total_recipients,
      videos_generated: acc.videos_generated + stats.videos_generated,
      videos_sent: acc.videos_sent + stats.videos_sent,
      videos_viewed: acc.videos_viewed + stats.videos_viewed,
      total_cost: acc.total_cost + stats.total_cost,
    };
  }, {
    total_recipients: 0,
    videos_generated: 0,
    videos_sent: 0,
    videos_viewed: 0,
    total_cost: 0,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading campaigns...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <button
          onClick={onCreateNew}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + New Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Recipients</div>
          <div className="text-3xl font-bold">{totalStats.total_recipients}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Videos Generated</div>
          <div className="text-3xl font-bold text-blue-600">{totalStats.videos_generated}</div>
          <div className="text-xs text-gray-500 mt-1">
            {totalStats.total_recipients > 0
              ? formatPercentage((totalStats.videos_generated / totalStats.total_recipients) * 100)
              : '0%'} complete
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Videos Viewed</div>
          <div className="text-3xl font-bold text-green-600">{totalStats.videos_viewed}</div>
          <div className="text-xs text-gray-500 mt-1">
            {totalStats.videos_sent > 0
              ? formatPercentage((totalStats.videos_viewed / totalStats.videos_sent) * 100)
              : '0%'} view rate
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Cost</div>
          <div className="text-3xl font-bold text-purple-600">{formatCost(totalStats.total_cost)}</div>
          <div className="text-xs text-gray-500 mt-1">
            {totalStats.videos_viewed > 0
              ? `${formatCost(totalStats.total_cost / totalStats.videos_viewed)} per view`
              : 'No views yet'}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold">All Campaigns</div>
            <div className="flex gap-2">
              {(['all', 'draft', 'processing', 'completed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === status
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {status === 'all' ? 'All' : getStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-5xl mb-4">📊</div>
            <div className="text-xl font-semibold text-gray-600 mb-2">
              {filter === 'all' ? 'No campaigns yet' : `No ${filter} campaigns`}
            </div>
            <div className="text-gray-500 mb-6">
              Create your first personalized video campaign to get started
            </div>
            <button
              onClick={onCreateNew}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Create Campaign
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {filteredCampaigns.map((campaign) => {
              const stats = campaignStats[campaign.id];
              const completionRate = stats && stats.total_recipients > 0
                ? (stats.videos_generated / stats.total_recipients) * 100
                : 0;

              return (
                <button
                  key={campaign.id}
                  onClick={() => onSelectCampaign(campaign)}
                  className="w-full p-6 hover:bg-gray-50 transition text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{campaign.campaign_name}</h3>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${getStatusColor(campaign.status)}20`,
                            color: getStatusColor(campaign.status),
                          }}
                        >
                          {getStatusLabel(campaign.status)}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium">
                          {getTierLabel(campaign.personalization_tier)}
                        </span>
                      </div>

                      {stats && (
                        <div className="grid grid-cols-4 gap-4 mt-4">
                          <div>
                            <div className="text-sm text-gray-600">Recipients</div>
                            <div className="text-xl font-semibold">{stats.total_recipients}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Generated</div>
                            <div className="text-xl font-semibold text-blue-600">{stats.videos_generated}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Sent</div>
                            <div className="text-xl font-semibold text-purple-600">{stats.videos_sent}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Viewed</div>
                            <div className="text-xl font-semibold text-green-600">{stats.videos_viewed}</div>
                          </div>
                        </div>
                      )}

                      {stats && stats.total_recipients > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">{formatPercentage(completionRate)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(completionRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-right ml-6">
                      <div className="text-sm text-gray-500">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </div>
                      {stats && (
                        <div className="text-lg font-semibold text-gray-900 mt-2">
                          {formatCost(stats.total_cost)}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
