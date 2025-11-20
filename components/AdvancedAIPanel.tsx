import React, { useState } from 'react';
import {
  detectVideoChapters,
  saveVideoChapters,
  optimizeVideoForSEO,
  saveVideoSEO,
  predictEngagement,
  saveEngagementPrediction,
  translateVideo,
  getVideoTranslations,
  getVideoAnalytics,
  generateBRollWithVeo,
  createCollaborationSession,
  getTemplates,
  generateVideoFromTemplate,
  analyzePresentationQuality,
  getPresentationFeedback,
  VideoChapter,
  VideoSEO,
  EngagementPrediction,
  VideoTranslation,
  VideoAnalytics,
  VideoTemplate,
  PresentationFeedback
} from '../services/advancedAIServices';
import { Loader } from './Loader';

interface AdvancedAIPanelProps {
  videoBlob: Blob | null;
  videoId?: string;
  script: string;
  onError: (message: string) => void;
}

export const AdvancedAIPanel: React.FC<AdvancedAIPanelProps> = ({
  videoBlob,
  videoId,
  script,
  onError
}) => {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Feature states
  const [chapters, setChapters] = useState<VideoChapter[] | null>(null);
  const [seoData, setSeoData] = useState<VideoSEO | null>(null);
  const [engagement, setEngagement] = useState<EngagementPrediction | null>(null);
  const [translations, setTranslations] = useState<VideoTranslation[]>([]);
  const [analytics, setAnalytics] = useState<VideoAnalytics | null>(null);
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [veoPrompt, setVeoPrompt] = useState('');
  const [veoStyle, setVeoStyle] = useState<'modern-tech' | 'cinematic' | 'abstract' | 'professional'>('modern-tech');
  const [veoDuration, setVeoDuration] = useState(5);
  const [collaborationCode, setCollaborationCode] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [coachFeedback, setCoachFeedback] = useState<PresentationFeedback[]>([]);

  // Handler functions
  const handleGenerateChapters = async () => {
    if (!videoBlob) {
      onError('Please record or upload a video first');
      return;
    }
    setLoading(true);
    setActiveFeature('chapters');
    try {
      const detectedChapters = await detectVideoChapters(videoBlob, script);
      setChapters(detectedChapters);
      if (videoId) {
        await saveVideoChapters(videoId, detectedChapters);
      }
    } catch (err: any) {
      onError(err.message || 'Failed to generate chapters');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeSEO = async () => {
    if (!videoBlob) {
      onError('Please record or upload a video first');
      return;
    }
    setLoading(true);
    setActiveFeature('seo');
    try {
      const seo = await optimizeVideoForSEO(videoBlob, script);
      setSeoData(seo);
      if (videoId) {
        await saveVideoSEO(videoId, seo);
      }
    } catch (err: any) {
      onError(err.message || 'Failed to optimize SEO');
    } finally {
      setLoading(false);
    }
  };

  const handlePredictEngagement = async () => {
    if (!videoBlob) {
      onError('Please record or upload a video first');
      return;
    }
    setLoading(true);
    setActiveFeature('engagement');
    try {
      const prediction = await predictEngagement(videoBlob, script);
      setEngagement(prediction);
      if (videoId) {
        await saveEngagementPrediction(videoId, prediction);
      }
    } catch (err: any) {
      onError(err.message || 'Failed to predict engagement');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!videoId) {
      onError('Please save your video first');
      return;
    }
    setLoading(true);
    setActiveFeature('translate');
    try {
      const translation = await translateVideo(videoId, script, targetLanguage);
      setTranslations([...translations, translation]);
    } catch (err: any) {
      onError(err.message || 'Failed to translate video');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadAnalytics = async () => {
    if (!videoId) {
      onError('Please save your video first');
      return;
    }
    setLoading(true);
    setActiveFeature('analytics');
    try {
      const analyticsData = await getVideoAnalytics(videoId);
      setAnalytics(analyticsData);
    } catch (err: any) {
      onError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVeoBRoll = async () => {
    if (!veoPrompt) {
      onError('Please enter a description for the B-roll');
      return;
    }
    setLoading(true);
    setActiveFeature('veo');
    try {
      const result = await generateBRollWithVeo({
        prompt: veoPrompt,
        duration: veoDuration,
        style: veoStyle
      });
      onError(`B-roll generated! Video ID: ${result.id}`);
    } catch (err: any) {
      onError(err.message || 'Failed to generate B-roll');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollaboration = async () => {
    if (!videoId) {
      onError('Please save your video first');
      return;
    }
    setLoading(true);
    setActiveFeature('collab');
    try {
      const session = await createCollaborationSession(videoId);
      setCollaborationCode(session.sessionCode);
    } catch (err: any) {
      onError(err.message || 'Failed to create collaboration session');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTemplates = async () => {
    setLoading(true);
    setActiveFeature('templates');
    try {
      const templatesList = await getTemplates(true);
      setTemplates(templatesList);
    } catch (err: any) {
      onError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadCoachFeedback = async () => {
    if (!videoId) {
      onError('Please save your video first');
      return;
    }
    setLoading(true);
    setActiveFeature('coach');
    try {
      const feedback = await getPresentationFeedback(videoId);
      setCoachFeedback(feedback);
    } catch (err: any) {
      onError(err.message || 'Failed to load coach feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-2xl shadow-black/20 p-6 backdrop-blur-lg space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">Advanced AI Features</h2>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader />
        </div>
      )}

      {/* Feature Buttons Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={handleGenerateChapters}
          disabled={!videoBlob || loading}
          className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
        >
          📑 Chapters
        </button>

        <button
          onClick={handleOptimizeSEO}
          disabled={!videoBlob || loading}
          className="p-3 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-lg hover:from-green-500 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
        >
          🎯 SEO
        </button>

        <button
          onClick={handlePredictEngagement}
          disabled={!videoBlob || loading}
          className="p-3 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
        >
          📊 Engagement
        </button>

        <button
          onClick={handleLoadAnalytics}
          disabled={!videoId || loading}
          className="p-3 bg-gradient-to-br from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
        >
          📈 Analytics
        </button>

        <button
          onClick={() => setActiveFeature(activeFeature === 'translate-form' ? null : 'translate-form')}
          disabled={!videoId || loading}
          className="p-3 bg-gradient-to-br from-pink-600 to-pink-700 text-white rounded-lg hover:from-pink-500 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
        >
          🌍 Translate
        </button>

        <button
          onClick={() => setActiveFeature(activeFeature === 'veo-form' ? null : 'veo-form')}
          disabled={loading}
          className="p-3 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-lg hover:from-red-500 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
        >
          🎬 B-Roll
        </button>

        <button
          onClick={handleCreateCollaboration}
          disabled={!videoId || loading}
          className="p-3 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
        >
          👥 Collaborate
        </button>

        <button
          onClick={handleLoadTemplates}
          disabled={loading}
          className="p-3 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
        >
          📋 Templates
        </button>

        <button
          onClick={handleLoadCoachFeedback}
          disabled={!videoId || loading}
          className="p-3 bg-gradient-to-br from-yellow-600 to-yellow-700 text-white rounded-lg hover:from-yellow-500 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
        >
          🎓 Coach
        </button>
      </div>

      {/* Veo B-Roll Form */}
      {activeFeature === 'veo-form' && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-white">Generate B-Roll with Veo 2</h3>
          <textarea
            value={veoPrompt}
            onChange={(e) => setVeoPrompt(e.target.value)}
            placeholder="Describe the B-roll scene you want to generate..."
            className="w-full h-24 bg-gray-800 border border-gray-600 rounded-lg p-3 text-white resize-none focus:ring-2 focus:ring-red-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400">Style</label>
              <select
                value={veoStyle}
                onChange={(e) => setVeoStyle(e.target.value as any)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-white"
              >
                <option value="modern-tech">Modern Tech</option>
                <option value="cinematic">Cinematic</option>
                <option value="abstract">Abstract</option>
                <option value="professional">Professional</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400">Duration (seconds)</label>
              <input
                type="number"
                value={veoDuration}
                onChange={(e) => setVeoDuration(Number(e.target.value))}
                min="3"
                max="30"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-white"
              />
            </div>
          </div>
          <button
            onClick={handleGenerateVeoBRoll}
            disabled={loading}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Generate B-Roll
          </button>
        </div>
      )}

      {/* Translation Form */}
      {activeFeature === 'translate-form' && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-white">Translate Video</h3>
          <div>
            <label className="text-sm text-gray-400">Target Language</label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-white"
            >
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="ja">Japanese</option>
              <option value="zh">Chinese</option>
              <option value="ar">Arabic</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
          <button
            onClick={handleTranslate}
            disabled={loading}
            className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
          >
            Translate
          </button>
        </div>
      )}

      {/* Chapters Display */}
      {activeFeature === 'chapters' && chapters && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-blue-400">Video Chapters</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {chapters.map((chapter, index) => (
              <div key={index} className="bg-gray-800 p-3 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-white">{chapter.title}</h4>
                  <span className="text-xs text-gray-400">
                    {chapter.startTime.toFixed(1)}s - {chapter.endTime.toFixed(1)}s
                  </span>
                </div>
                <p className="text-sm text-gray-300">{chapter.summary}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setActiveFeature(null)}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      )}

      {/* SEO Display */}
      {activeFeature === 'seo' && seoData && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-green-400">SEO Optimization</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Optimized Title</label>
              <p className="text-white font-medium">{seoData.optimizedTitle}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Description</label>
              <p className="text-white text-sm">{seoData.description}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Tags</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {seoData.tags.map((tag, i) => (
                  <span key={i} className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Platform Optimizations</label>
              <div className="space-y-2 mt-2">
                {seoData.platformOptimizations.linkedin && (
                  <div className="bg-gray-800 p-2 rounded">
                    <p className="text-xs font-medium text-gray-400">LinkedIn</p>
                    <p className="text-sm text-white">{seoData.platformOptimizations.linkedin.caption}</p>
                    <div className="flex gap-1 mt-1">
                      {seoData.platformOptimizations.linkedin.hashtags.map((tag, i) => (
                        <span key={i} className="text-xs text-blue-400">#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveFeature(null)}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      )}

      {/* Engagement Prediction Display */}
      {activeFeature === 'engagement' && engagement && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-purple-400">Engagement Prediction</h3>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-yellow-400">{engagement.overallScore}</div>
              <div className="text-xs text-gray-400">Engagement Score</div>
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-yellow-400 h-3 rounded-full transition-all"
                  style={{ width: `${engagement.overallScore}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Predicted Completion: {(engagement.predictedCompletionRate * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-green-400 mb-2">Strengths</h4>
            <ul className="list-disc list-inside space-y-1">
              {engagement.strengths.map((strength, i) => (
                <li key={i} className="text-sm text-gray-300">{strength}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-red-400 mb-2">Areas to Improve</h4>
            <ul className="list-disc list-inside space-y-1">
              {engagement.weaknesses.map((weakness, i) => (
                <li key={i} className="text-sm text-gray-300">{weakness}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-blue-400 mb-2">Recommendations</h4>
            <ul className="list-decimal list-inside space-y-1">
              {engagement.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-gray-300">{rec}</li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => setActiveFeature(null)}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      )}

      {/* Analytics Display */}
      {activeFeature === 'analytics' && analytics && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-orange-400">Video Analytics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-white">{analytics.views}</div>
              <div className="text-xs text-gray-400">Views</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-white">{analytics.uniqueViewers}</div>
              <div className="text-xs text-gray-400">Unique Viewers</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-white">{Math.round(analytics.avgWatchTime)}s</div>
              <div className="text-xs text-gray-400">Avg Watch Time</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-white">{(analytics.completionRate * 100).toFixed(0)}%</div>
              <div className="text-xs text-gray-400">Completion Rate</div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-blue-400 mb-2">AI Insights</h4>
            <ul className="list-disc list-inside space-y-1">
              {analytics.aiInsights.map((insight, i) => (
                <li key={i} className="text-sm text-gray-300">{insight}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-green-400 mb-2">Recommendations</h4>
            <ul className="list-decimal list-inside space-y-1">
              {analytics.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-gray-300">{rec}</li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => setActiveFeature(null)}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      )}

      {/* Collaboration Session Display */}
      {activeFeature === 'collab' && collaborationCode && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-teal-400">Collaboration Session Created</h3>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-400 mb-2">Share this code with collaborators:</p>
            <p className="text-3xl font-bold text-white tracking-wider">{collaborationCode}</p>
          </div>
          <p className="text-sm text-gray-400 text-center">
            Session expires in 24 hours
          </p>
          <button
            onClick={() => setActiveFeature(null)}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      )}

      {/* Templates Display */}
      {activeFeature === 'templates' && templates.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-indigo-400">Video Templates</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {templates.map((template) => (
              <div key={template.id} className="bg-gray-800 p-3 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-white">{template.name}</h4>
                  <span className="text-xs text-gray-400 px-2 py-1 bg-indigo-600 rounded">
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-2">{template.description}</p>
                <p className="text-xs text-gray-500">Used {template.usageCount} times</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setActiveFeature(null)}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      )}

      {/* Coach Feedback Display */}
      {activeFeature === 'coach' && coachFeedback.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-yellow-400">Presentation Coach Feedback</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {coachFeedback.map((feedback, index) => (
              <div key={index} className={`p-3 rounded-lg ${
                feedback.severity === 'critical' ? 'bg-red-900/30 border border-red-700' :
                feedback.severity === 'warning' ? 'bg-yellow-900/30 border border-yellow-700' :
                'bg-green-900/30 border border-green-700'
              }`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium text-white capitalize">
                    {feedback.feedbackType.replace('_', ' ')}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    feedback.severity === 'critical' ? 'bg-red-600' :
                    feedback.severity === 'warning' ? 'bg-yellow-600' :
                    'bg-green-600'
                  } text-white`}>
                    {feedback.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{feedback.suggestion}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setActiveFeature(null)}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};
