import React, { useState, useEffect } from 'react';
import { Campaign, CampaignRecipient, createCampaign, addRecipients, calculateEstimatedCost } from '../../services/campaignService';
import { parseCSV, getCSVTemplate, downloadCSV } from '../../lib/csvParser';
import { getTierLabel, getTierDescription, getTierColor, formatCost, formatDuration } from '../../lib/campaignUtils';
import { VisualStyle } from '../../services/geminiService';
import { UserVideo } from '../../lib/supabase';

interface CampaignCreatorProps {
  onComplete: (campaign: Campaign) => void;
  onCancel: () => void;
  existingVideos?: UserVideo[];
}

type WizardStep = 'setup' | 'video' | 'script' | 'tier' | 'recipients' | 'review';

export const CampaignCreator: React.FC<CampaignCreatorProps> = ({ onComplete, onCancel, existingVideos = [] }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('setup');
  const [campaignName, setCampaignName] = useState('');
  const [description, setDescription] = useState('');
  const [useCase, setUseCase] = useState<Campaign['use_case']>('cold_outreach');
  const [selectedVideo, setSelectedVideo] = useState<UserVideo | null>(null);
  const [scriptTemplate, setScriptTemplate] = useState('');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('Modern Tech');
  const [tier, setTier] = useState<'basic' | 'smart' | 'advanced'>('smart');
  const [csvText, setCsvText] = useState('');
  const [recipients, setRecipients] = useState<Partial<CampaignRecipient>[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps: WizardStep[] = ['setup', 'video', 'script', 'tier', 'recipients', 'review'];
  const stepIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);

      const parsed = parseCSV(text);
      if (parsed.errors.length > 0) {
        setError(`CSV Errors: ${parsed.errors.join(', ')}`);
      } else {
        const mappedRecipients: Partial<CampaignRecipient>[] = parsed.rows.map(row => ({
          recipient_name: row.name || row.recipient_name || '',
          recipient_email: row.email || row.recipient_email || '',
          company: row.company || '',
          role: row.role || row.title || '',
          industry: row.industry || '',
          pain_point: row.pain_point || row.challenge || '',
          custom_fields: row,
        }));
        setRecipients(mappedRecipients);
        setError(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const template = getCSVTemplate();
    downloadCSV('campaign-template.csv', template);
  };

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const campaign = await createCampaign({
        campaign_name: campaignName,
        master_video_id: selectedVideo?.id,
        template_script: scriptTemplate,
        personalization_tier: tier,
        visual_style: visualStyle,
        status: 'draft',
        use_case: useCase,
      });

      if (recipients.length > 0) {
        await addRecipients(campaign.id, recipients);
      }

      onComplete(campaign);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const estimatedCost = calculateEstimatedCost(recipients.length, tier);
  const estimatedTime = recipients.length * (tier === 'basic' ? 15 : tier === 'smart' ? 45 : 120);

  const renderStep = () => {
    switch (currentStep) {
      case 'setup':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Campaign Setup</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Campaign Name</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Q4 Sales Outreach"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
                placeholder="Target enterprise clients in the tech sector"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Use Case</label>
              <div className="grid grid-cols-2 gap-3">
                {(['cold_outreach', 'abm', 'onboarding', 'follow_up'] as const).map((uc) => (
                  <button
                    key={uc}
                    onClick={() => setUseCase(uc)}
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      useCase === uc
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold capitalize">{uc.replace('_', ' ')}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {uc === 'cold_outreach' && 'B2B sales prospecting'}
                      {uc === 'abm' && 'Account-based marketing'}
                      {uc === 'onboarding' && 'Customer onboarding'}
                      {uc === 'follow_up' && 'Follow-up sequences'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Select Master Video</h2>
            <p className="text-gray-600">Choose a video from your library to personalize for each recipient</p>

            {existingVideos.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-gray-500">No videos in your library yet</p>
                <p className="text-sm text-gray-400 mt-2">Record a video first, then create a campaign</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {existingVideos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      selectedVideo?.id === video.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <video
                      src={video.video_url}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                    <div className="font-medium">{video.video_name}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(video.created_at).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 'script':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Script Template</h2>
            <p className="text-gray-600">Use variables like [NAME], [COMPANY], [ROLE] to personalize</p>

            <div>
              <textarea
                value={scriptTemplate}
                onChange={(e) => setScriptTemplate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg font-mono"
                rows={8}
                placeholder="Hi [NAME], I noticed [COMPANY] is working on [INDUSTRY] solutions..."
              />
              <div className="text-sm text-gray-500 mt-2">
                Available variables: [NAME], [COMPANY], [ROLE], [INDUSTRY], [PAIN_POINT], [EMAIL]
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Visual Style</label>
              <select
                value={visualStyle}
                onChange={(e) => setVisualStyle(e.target.value as VisualStyle)}
                className="w-full px-4 py-2 border rounded-lg"
              >
                {['Modern Tech', 'Photorealistic', 'Cinematic', 'Corporate', 'Minimalist', 'Vibrant'].map((style) => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'tier':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Choose Personalization Tier</h2>

            <div className="space-y-4">
              {(['basic', 'smart', 'advanced'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`w-full p-6 rounded-lg border-2 text-left transition ${
                    tier === t
                      ? 'border-2'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ borderColor: tier === t ? getTierColor(t) : undefined }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xl font-bold" style={{ color: getTierColor(t) }}>
                      {getTierLabel(t)}
                    </div>
                    <div className="text-2xl font-bold">{formatCost(t === 'basic' ? 0.02 : t === 'smart' ? 0.05 : 0.15)}/video</div>
                  </div>
                  <p className="text-gray-600">{getTierDescription(t)}</p>
                  <div className="text-sm text-gray-500 mt-2">
                    Estimated processing: {formatDuration(t === 'basic' ? 15 : t === 'smart' ? 45 : 120)}/video
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'recipients':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Add Recipients</h2>

            <div className="flex gap-3">
              <button
                onClick={handleDownloadTemplate}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Download CSV Template
              </button>
              <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                Upload CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
              </label>
            </div>

            {recipients.length > 0 && (
              <div className="border rounded-lg p-4">
                <div className="font-medium mb-2">{recipients.length} Recipients Loaded</div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {recipients.slice(0, 10).map((r, i) => (
                    <div key={i} className="text-sm flex justify-between items-center py-2 border-b">
                      <div>
                        <div className="font-medium">{r.recipient_name}</div>
                        <div className="text-gray-500">{r.recipient_email}</div>
                      </div>
                      <div className="text-gray-500">{r.company}</div>
                    </div>
                  ))}
                  {recipients.length > 10 && (
                    <div className="text-sm text-gray-500 text-center pt-2">
                      + {recipients.length - 10} more recipients
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Review & Launch</h2>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <div className="text-sm text-gray-600">Campaign Name</div>
                <div className="font-medium">{campaignName}</div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Master Video</div>
                <div className="font-medium">{selectedVideo?.video_name || 'None selected'}</div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Personalization Tier</div>
                <div className="font-medium" style={{ color: getTierColor(tier) }}>
                  {getTierLabel(tier)}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Recipients</div>
                <div className="font-medium">{recipients.length} contacts</div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm text-gray-600">Estimated Cost</div>
                <div className="text-2xl font-bold text-blue-600">{formatCost(estimatedCost)}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {formatCost(estimatedCost / recipients.length)} per recipient
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Estimated Processing Time</div>
                <div className="font-medium">{formatDuration(Math.ceil(estimatedTime / 1000))}</div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                {error}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'setup':
        return campaignName.trim().length > 0;
      case 'video':
        return true;
      case 'script':
        return scriptTemplate.trim().length > 0;
      case 'tier':
        return true;
      case 'recipients':
        return recipients.length > 0;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  index <= stepIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    index < stepIndex ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        {renderStep()}

        <div className="flex justify-between mt-8 pt-6 border-t">
          <button
            onClick={stepIndex === 0 ? onCancel : handleBack}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          >
            {stepIndex === 0 ? 'Cancel' : 'Back'}
          </button>

          {currentStep === 'review' ? (
            <button
              onClick={handleCreate}
              disabled={isCreating || !canProceed()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Campaign'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
