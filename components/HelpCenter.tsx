import React, { useState } from 'react';
import { logHelpInteraction } from '../services/onboardingService';

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
}

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'getting-started',
    title: 'Getting Started: Your First Video',
    category: 'Basics',
    content: `Create your first video in 3 simple steps:

1. Write or select a script template
2. Record your video with our presentation coach
3. Send it via email or create a campaign

Tips for success:
- Keep videos under 90 seconds
- Look directly at the camera
- Use a quiet environment
- Test your audio first`,
    tags: ['beginner', 'video', 'recording']
  },
  {
    id: 'veo-generation',
    title: 'VEO AI Video Generation',
    category: 'AI Features',
    content: `Generate professional video backgrounds using Google's VEO AI:

How it works:
1. Open the AI Features panel
2. Click "Generate VEO Background"
3. Describe your desired scene in the prompt
4. Select duration (5-10 seconds recommended)
5. Choose a style (professional, cinematic, modern-tech, abstract)
6. Wait for generation (1-2 minutes)

Available models:
- veo-2: Highest quality, longer generation time
- veo-2-flash: Faster generation
- veo-2-gemini: Best for complex scenes
- veo-003: Alternative model

Tips:
- Be specific in your prompts
- Describe lighting, mood, and movement
- Start with shorter durations
- Review examples in the prompt library`,
    tags: ['ai', 'veo', 'generation', 'backgrounds']
  },
  {
    id: 'seo-optimization',
    title: 'Video SEO Optimization',
    category: 'AI Features',
    content: `Optimize your videos for search engines and social media:

What you get:
- Optimized title (60 chars, keyword-rich)
- Compelling description (160 chars)
- 10 relevant tags
- Full transcript for accessibility
- Platform-specific optimizations (LinkedIn, YouTube, Twitter)
- Thumbnail suggestions with predicted CTR

How to use:
1. Upload or record your video
2. Open AI Features panel
3. Click "Optimize SEO"
4. Review generated metadata
5. Apply to your video
6. Edit as needed

Best practices:
- Include target keywords in your script
- Speak clearly for accurate transcription
- Review and refine AI suggestions
- Test different titles for engagement`,
    tags: ['seo', 'optimization', 'metadata', 'ai']
  },
  {
    id: 'engagement-prediction',
    title: 'Predicting Video Engagement',
    category: 'Analytics',
    content: `Get AI-powered predictions before publishing:

Analysis includes:
- Overall engagement score (0-100)
- Predicted drop-off points with timestamps
- Viewer completion rate estimate
- Specific recommendations for improvement
- Video strengths and weaknesses

How to interpret results:
- Score 80+: Excellent engagement potential
- Score 60-79: Good, minor improvements suggested
- Score 40-59: Fair, several areas to improve
- Score <40: Significant revisions recommended

Common recommendations:
- Adjust pacing for key moments
- Strengthen opening hook
- Add visual variety
- Improve audio quality
- Optimize video length`,
    tags: ['analytics', 'engagement', 'prediction', 'ai']
  },
  {
    id: 'campaigns',
    title: 'Creating Email Campaigns',
    category: 'Campaigns',
    content: `Send personalized video emails at scale:

Steps to create a campaign:
1. Click "Campaigns" in header
2. Create new campaign
3. Upload contacts (CSV format)
4. Select or record video
5. Customize email template
6. Add personalization variables
7. Preview and test
8. Schedule or send immediately

CSV format requirements:
- Required: email, first_name
- Optional: last_name, company, title
- No empty rows
- UTF-8 encoding

Personalization variables:
- {{first_name}}: Recipient's first name
- {{last_name}}: Recipient's last name
- {{company}}: Company name
- {{title}}: Job title

Tracking:
- Email opens
- Video views
- Click-through rates
- Response rates
- Individual recipient engagement`,
    tags: ['campaigns', 'email', 'bulk', 'personalization']
  },
  {
    id: 'presentation-coach',
    title: 'Real-Time Presentation Coaching',
    category: 'Recording',
    content: `Get instant feedback while recording:

Features:
- Pace monitoring (too fast/slow alerts)
- Energy level detection
- Eye contact tracking
- Posture analysis
- Gesture suggestions
- Clarity assessment

Severity levels:
- Good: You're doing great!
- Warning: Minor adjustments suggested
- Critical: Needs immediate attention

Common feedback:
- "Slow down": Speaking too quickly
- "Make eye contact": Looking away from camera
- "Increase energy": Delivery seems flat
- "Improve posture": Slouching detected
- "Speak up": Volume too low

Tips for best results:
- Position camera at eye level
- Sit 2-3 feet from camera
- Use good lighting (face should be well-lit)
- Minimize background distractions
- Practice with coach before final recording`,
    tags: ['presentation', 'coaching', 'recording', 'feedback']
  },
  {
    id: 'voice-cloning',
    title: 'Voice Cloning & Dubbing',
    category: 'AI Features',
    content: `Create videos in multiple languages with your voice:

Process:
1. Record a voice sample (30-60 seconds)
2. AI analyzes voice characteristics
3. Generate speech in target language
4. Video automatically synced

Supported languages:
- Spanish, French, German, Italian
- Portuguese, Japanese, Chinese
- Korean, Arabic, Hindi
- And 40+ more languages

Quality factors:
- Sample audio quality (use quiet environment)
- Clear pronunciation
- Natural speech patterns
- Consistent volume

Best practices:
- Record diverse sentences
- Speak naturally
- Avoid background noise
- Use good microphone
- Review and refine output`,
    tags: ['voice', 'cloning', 'translation', 'dubbing', 'ai']
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    category: 'Tips & Tricks',
    content: `Speed up your workflow with keyboard shortcuts:

Recording:
- Space: Start/Stop recording
- R: Start recording
- S: Stop recording
- Delete: Delete take

Video Editor:
- P: Play/Pause
- Left/Right Arrow: Skip 5 seconds
- J/L: Rewind/Forward
- M: Toggle mute
- F: Full screen

General:
- Shift+?: Show keyboard shortcuts
- Ctrl/Cmd+S: Save project
- Ctrl/Cmd+Z: Undo
- Ctrl/Cmd+Shift+Z: Redo
- Esc: Close modal/dialog

Navigation:
- 1: Script editor
- 2: Video recorder
- 3: Video editor
- 4: Email composer
- 5: Video library`,
    tags: ['shortcuts', 'keyboard', 'productivity', 'tips']
  }
];

interface HelpCenterProps {
  onClose: () => void;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  const categories = ['all', ...Array.from(new Set(HELP_ARTICLES.map(a => a.category)))];

  const filteredArticles = HELP_ARTICLES.filter(article => {
    const matchesSearch = searchTerm === '' ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term) {
      logHelpInteraction('help_search', term);
    }
  };

  const handleArticleClick = (article: HelpArticle) => {
    setSelectedArticle(article);
    logHelpInteraction('tooltip_view', article.id);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Help Center</h2>
              <p className="text-sm text-gray-500">Find answers and learn about features</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!selectedArticle ? (
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search help articles..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="flex gap-2 flex-wrap">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500">No articles found matching your search</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredArticles.map(article => (
                    <button
                      key={article.id}
                      onClick={() => handleArticleClick(article)}
                      className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">{article.category}</p>
                          <div className="flex flex-wrap gap-1">
                            {article.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="p-6 border-b border-gray-200">
              <button
                onClick={() => setSelectedArticle(null)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to articles
              </button>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedArticle.title}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                  {selectedArticle.category}
                </span>
                <div className="flex gap-1">
                  {selectedArticle.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-blue max-w-none">
                {selectedArticle.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="text-gray-700 leading-relaxed mb-4 whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
