import React, { useState, useEffect } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [activeTab, setActiveTab] = useState<'features' | 'ai' | 'workflow'>('features');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-green-600/20 blur-3xl animate-pulse"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-green-400 to-blue-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              AI-Powered Video Email Platform
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-4xl mx-auto">
              Create personalized video emails with advanced AI features to scale your business and win high-earning executive positions
            </p>
            <p className="text-lg text-gray-400 mb-8 max-w-3xl mx-auto">
              Record once, personalize at scale. Use Google's cutting-edge AI to generate chapters, optimize SEO, predict engagement, and translate into multiple languages.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white text-lg font-semibold rounded-xl hover:from-blue-500 hover:to-green-500 transition-all duration-300 shadow-lg shadow-blue-500/50 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/60 active:scale-95"
              >
                Get Started Free
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-gray-800 border border-gray-600 text-white text-lg font-semibold rounded-xl hover:bg-gray-700 transition-all duration-300 hover:border-blue-500 hover:shadow-lg active:scale-95"
              >
                Explore Features
              </button>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2 transition-all duration-300 hover:text-white">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2 transition-all duration-300 hover:text-white">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <span>AI-powered automation</span>
              </div>
              <div className="flex items-center gap-2 transition-all duration-300 hover:text-white">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                <span>Enterprise-grade security</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-800/50 backdrop-blur-lg border-y border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group cursor-default">
              <div className="text-4xl font-bold text-blue-400 mb-2 transition-all duration-300 group-hover:scale-110 group-hover:text-blue-300">10+</div>
              <div className="text-gray-400 transition-all duration-300 group-hover:text-gray-300">AI Features</div>
            </div>
            <div className="text-center group cursor-default">
              <div className="text-4xl font-bold text-green-400 mb-2 transition-all duration-300 group-hover:scale-110 group-hover:text-green-300">4</div>
              <div className="text-gray-400 transition-all duration-300 group-hover:text-gray-300">Veo Models</div>
            </div>
            <div className="text-center group cursor-default">
              <div className="text-4xl font-bold text-blue-400 mb-2 transition-all duration-300 group-hover:scale-110 group-hover:text-blue-300">9+</div>
              <div className="text-gray-400 transition-all duration-300 group-hover:text-gray-300">Languages</div>
            </div>
            <div className="text-center group cursor-default">
              <div className="text-4xl font-bold text-green-400 mb-2 transition-all duration-300 group-hover:scale-110 group-hover:text-green-300">100%</div>
              <div className="text-gray-400 transition-all duration-300 group-hover:text-gray-300">Personalized</div>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-center mb-4">Perfect for Solopreneurs & Agencies</h2>
        <p className="text-xl text-gray-400 text-center mb-12 max-w-3xl mx-auto">
          Scale your outreach and land high-value clients with personalized video that stands out
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 hover:border-blue-500 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
            <div className="text-4xl mb-4 transition-transform duration-500 hover:scale-125 hover:rotate-12">🚀</div>
            <h3 className="text-2xl font-bold mb-3">Scale Your Agency</h3>
            <p className="text-gray-400 mb-4">
              Create personalized video pitches at scale. Record once, customize for each client using AI templates and personalization.
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Bulk personalization with templates</li>
              <li>• AI-generated custom scripts</li>
              <li>• Multi-language support</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 hover:border-green-500 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20">
            <div className="text-4xl mb-4 transition-transform duration-500 hover:scale-125 hover:rotate-12">💼</div>
            <h3 className="text-2xl font-bold mb-3">Land Executive Roles</h3>
            <p className="text-gray-400 mb-4">
              Stand out from hundreds of applicants with personalized video applications that showcase your expertise and personality.
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Presentation coaching with AI</li>
              <li>• Professional B-roll generation</li>
              <li>• Engagement optimization</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 hover:border-blue-500 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
            <div className="text-4xl mb-4 transition-transform duration-500 hover:scale-125 hover:rotate-12">📈</div>
            <h3 className="text-2xl font-bold mb-3">Close More Deals</h3>
            <p className="text-gray-400 mb-4">
              Increase response rates by 300% with video emails. Track engagement, optimize content, and follow up at the perfect time.
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Real-time analytics dashboard</li>
              <li>• Engagement prediction AI</li>
              <li>• SEO-optimized content</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-gray-800/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-4">Powered by Google's Advanced AI</h2>
          <p className="text-xl text-gray-400 text-center mb-12">
            All the tools you need to create, optimize, and scale professional video content
          </p>

          {/* Feature Tabs */}
          <div className="flex justify-center gap-4 mb-12 flex-wrap">
            <button
              onClick={() => setActiveTab('features')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                activeTab === 'features'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Core Features
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                activeTab === 'ai'
                  ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              AI Capabilities
            </button>
            <button
              onClick={() => setActiveTab('workflow')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                activeTab === 'workflow'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Workflow Tools
            </button>
          </div>

          {/* Core Features Tab */}
          {activeTab === 'features' && (
            <div className="animate-fadeIn">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon="🎥"
                title="Video Recording"
                description="Professional in-browser recording with take comparison and retake options"
              />
              <FeatureCard
                icon="✂️"
                title="Video Editing"
                description="Trim, crop, and edit your videos with an intuitive timeline editor"
              />
              <FeatureCard
                icon="📧"
                title="Email Integration"
                description="Send videos directly via email or generate shareable links"
              />
              <FeatureCard
                icon="🎨"
                title="Custom Thumbnails"
                description="AI-powered thumbnail selection or manual frame picking"
              />
              <FeatureCard
                icon="📊"
                title="Analytics Dashboard"
                description="Track views, watch time, completion rates, and viewer demographics"
              />
              <FeatureCard
                icon="📱"
                title="Responsive Design"
                description="Works perfectly on desktop, tablet, and mobile devices"
              />
            </div>
            </div>
          )}

          {/* AI Capabilities Tab */}
          {activeTab === 'ai' && (
            <div className="animate-fadeIn">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon="🎬"
                title="Veo Video Generation"
                description="Generate professional B-roll with Veo 2, Veo 2 Flash, Veo 2 Gemini, or Veo 003"
                highlight="4 Models"
              />
              <FeatureCard
                icon="📑"
                title="Smart Chapters"
                description="Auto-detect topic transitions and create timestamped navigation"
                highlight="Gemini 2.5 Pro"
              />
              <FeatureCard
                icon="🎯"
                title="SEO Optimizer"
                description="Generate optimized titles, descriptions, and platform-specific content"
                highlight="AI-Powered"
              />
              <FeatureCard
                icon="📈"
                title="Engagement Prediction"
                description="Predict drop-off points and get recommendations before publishing"
                highlight="Predictive AI"
              />
              <FeatureCard
                icon="🌍"
                title="Multi-Language"
                description="Translate videos into 9+ languages with cultural context preservation"
                highlight="9+ Languages"
              />
              <FeatureCard
                icon="🎓"
                title="Presentation Coach"
                description="Real-time feedback on pace, energy, eye contact, and delivery"
                highlight="Live Analysis"
              />
              <FeatureCard
                icon="🎤"
                title="Voice Analysis"
                description="Analyze voice characteristics for consistent branding across videos"
                highlight="Voice AI"
              />
              <FeatureCard
                icon="🖼️"
                title="Scene Generation"
                description="Generate custom backgrounds and overlays with Imagen 3"
                highlight="Imagen 3"
              />
              <FeatureCard
                icon="🤖"
                title="AI Assistant"
                description="Get script suggestions, content ideas, and optimization tips"
                highlight="Chat AI"
              />
            </div>
            </div>
          )}

          {/* Workflow Tools Tab */}
          {activeTab === 'workflow' && (
            <div className="animate-fadeIn">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon="📋"
                title="Video Templates"
                description="Pre-built templates for sales pitches, demos, onboarding, and more"
              />
              <FeatureCard
                icon="👥"
                title="Team Collaboration"
                description="Share videos with team members and collect timestamped feedback"
              />
              <FeatureCard
                icon="🔄"
                title="Batch Processing"
                description="Process multiple videos with the same AI features at once"
              />
              <FeatureCard
                icon="📚"
                title="Video Library"
                description="Organize, search, and manage all your videos in one place"
              />
              <FeatureCard
                icon="🔗"
                title="Zapier Integration"
                description="Connect with 5,000+ apps via webhook automation"
              />
              <FeatureCard
                icon="🎬"
                title="Script Editor"
                description="Write, edit, and generate scripts with AI assistance"
              />
            </div>
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-center mb-4">How It Works</h2>
        <p className="text-xl text-gray-400 text-center mb-16">
          Get started in minutes, no technical skills required
        </p>

        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center group">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-lg group-hover:shadow-blue-500/50">
              1
            </div>
            <h3 className="text-xl font-bold mb-2">Record Video</h3>
            <p className="text-gray-400">
              Use your webcam to record or upload existing video content
            </p>
          </div>

          <div className="text-center group">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-lg group-hover:shadow-green-500/50">
              2
            </div>
            <h3 className="text-xl font-bold mb-2">Enhance with AI</h3>
            <p className="text-gray-400">
              Apply AI features like chapters, SEO, translations, and B-roll
            </p>
          </div>

          <div className="text-center group">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-lg group-hover:shadow-blue-500/50">
              3
            </div>
            <h3 className="text-xl font-bold mb-2">Personalize</h3>
            <p className="text-gray-400">
              Use templates to create personalized versions for each recipient
            </p>
          </div>

          <div className="text-center group">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-lg group-hover:shadow-green-500/50">
              4
            </div>
            <h3 className="text-xl font-bold mb-2">Send & Track</h3>
            <p className="text-gray-400">
              Send via email and track engagement with real-time analytics
            </p>
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="bg-gray-800/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-4">Built with Cutting-Edge Technology</h2>
          <p className="text-xl text-gray-400 text-center mb-12">
            Powered by Google's most advanced AI models
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center transition-all duration-500 hover:border-blue-500 hover:transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 group">
              <div className="text-3xl mb-3 transition-transform duration-500 group-hover:scale-125">🤖</div>
              <h3 className="font-bold mb-2">Gemini 2.5 Pro</h3>
              <p className="text-sm text-gray-400">Video analysis & SEO</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center transition-all duration-500 hover:border-green-500 hover:transform hover:scale-105 hover:shadow-xl hover:shadow-green-500/30 group">
              <div className="text-3xl mb-3 transition-transform duration-500 group-hover:scale-125">⚡</div>
              <h3 className="font-bold mb-2">Gemini 2.5 Flash</h3>
              <p className="text-sm text-gray-400">Fast translations & predictions</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center transition-all duration-500 hover:border-blue-500 hover:transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 group">
              <div className="text-3xl mb-3 transition-transform duration-500 group-hover:scale-125">🎬</div>
              <h3 className="font-bold mb-2">Veo 2</h3>
              <p className="text-sm text-gray-400">Professional video generation</p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center transition-all duration-500 hover:border-green-500 hover:transform hover:scale-105 hover:shadow-xl hover:shadow-green-500/30 group">
              <div className="text-3xl mb-3 transition-transform duration-500 group-hover:scale-125">🖼️</div>
              <h3 className="font-bold mb-2">Imagen 3</h3>
              <p className="text-sm text-gray-400">Scene & background generation</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-green-400 opacity-0 hover:opacity-20 transition-opacity duration-500"></div>
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to Scale Your Business?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join solopreneurs and agencies using AI-powered video to close more deals and land high-value positions
            </p>
            <button
              onClick={onGetStarted}
              className="px-10 py-5 bg-white text-blue-600 text-lg font-bold rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-2xl transform hover:scale-110 active:scale-95 hover:shadow-white/50"
            >
              Start Creating Free Videos Now
            </button>
            <p className="text-sm mt-4 text-blue-100">
              No credit card required • Set up in under 2 minutes
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400 text-sm">
          <p>Built for solopreneurs and agencies to scale their outreach and close high-value deals</p>
        </div>
      </div>
    </div>
  );
};

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  highlight?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, highlight }) => {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-blue-500 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 group cursor-pointer">
      <div className="text-4xl mb-3 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-6">{icon}</div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-xl font-bold transition-colors duration-300 group-hover:text-blue-400">{title}</h3>
        {highlight && (
          <span className="text-xs px-2 py-1 bg-blue-600 rounded-full transition-all duration-300 group-hover:bg-blue-500 group-hover:scale-110">{highlight}</span>
        )}
      </div>
      <p className="text-gray-400 text-sm transition-colors duration-300 group-hover:text-gray-300">{description}</p>
    </div>
  );
};
