import React, { useState, useEffect, useRef } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [activeTab, setActiveTab] = useState<'features' | 'ai' | 'workflow'>('features');
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [stats, setStats] = useState({ features: 0, models: 0, languages: 0, personalized: 0 });
  const [hasAnimatedStats, setHasAnimatedStats] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedStats) {
            setHasAnimatedStats(true);
            animateStats();
          }
        });
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimatedStats]);

  const animateStats = () => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;

      setStats({
        features: Math.floor(10 * progress),
        models: Math.floor(4 * progress),
        languages: Math.floor(9 * progress),
        personalized: Math.floor(100 * progress),
      });

      if (step >= steps) {
        clearInterval(timer);
        setStats({ features: 10, models: 4, languages: 9, personalized: 100 });
      }
    }, interval);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden relative">
      {/* Animated Background Mesh Gradient */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-floatSlow"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-green-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-floatSlow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-floatSlow" style={{ animationDelay: '4s' }}></div>

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `particle ${10 + Math.random() * 20}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Content Container */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
            <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {/* Animated Title */}
              <div className="mb-6 relative">
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-green-400 to-blue-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  AI-Powered Video Creation
                </h1>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              </div>

              <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-4xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                Create personalized video emails with Google's advanced AI to scale your business and win executive positions
              </p>
              <p className="text-lg text-gray-400 mb-8 max-w-3xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                Record once, personalize at scale. Generate videos, optimize SEO, predict engagement, and translate into multiple languages.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
                <button
                  onClick={onGetStarted}
                  className="relative px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white text-lg font-semibold rounded-xl overflow-hidden group"
                >
                  <span className="relative z-10">Get Started Free</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                  <div className="absolute inset-0 animate-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-gray-800/50 backdrop-blur-sm border border-gray-600 text-white text-lg font-semibold rounded-xl hover:bg-gray-700/50 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group"
                >
                  <span className="group-hover:translate-x-1 inline-block transition-transform duration-300">Explore Features →</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2 transition-all duration-300 hover:text-white hover:scale-105 animate-fadeInUp" style={{ animationDelay: '0.8s' }}>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2 transition-all duration-300 hover:text-white hover:scale-105 animate-fadeInUp" style={{ animationDelay: '0.9s' }}>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  <span>4-8 second video generation</span>
                </div>
                <div className="flex items-center gap-2 transition-all duration-300 hover:text-white hover:scale-105 animate-fadeInUp" style={{ animationDelay: '1s' }}>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                  <span>Enterprise-grade security</span>
                </div>
              </div>
            </div>

            {/* Floating Feature Preview Cards */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <FeaturePreviewCard
                icon="🎬"
                title="Veo Video Generation"
                description="4-8 second AI videos"
                delay={0.2}
              />
              <FeaturePreviewCard
                icon="🎯"
                title="Smart Prompts"
                description="50+ templates included"
                delay={0.4}
              />
              <FeaturePreviewCard
                icon="📊"
                title="Real-time Analytics"
                description="Track every view"
                delay={0.6}
              />
            </div>
          </div>
        </div>

        {/* Animated Stats Section */}
        <div ref={statsRef} className="bg-gray-800/30 backdrop-blur-xl border-y border-gray-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCard number={stats.features} suffix="+" label="AI Features" color="blue" />
              <StatCard number={stats.models} suffix="" label="Veo Models" color="green" />
              <StatCard number={stats.languages} suffix="+" label="Languages" color="blue" />
              <StatCard number={stats.personalized} suffix="%" label="Personalized" color="green" />
            </div>
          </div>
        </div>

        {/* Interactive Feature Demos Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">See It In Action</h2>
          <p className="text-xl text-gray-400 text-center mb-16 max-w-3xl mx-auto">
            Interactive demos showing how our AI transforms your video workflow
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <InteractiveDemo
              title="AI Prompt Builder"
              description="Watch how our AI generates optimized prompts for Gemini Veo"
              demoType="prompt"
            />
            <InteractiveDemo
              title="Video Generation"
              description="See the 4-8 second video creation process in real-time"
              demoType="generation"
            />
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="bg-gray-800/20 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">Perfect for Solopreneurs & Agencies</h2>
            <p className="text-xl text-gray-400 text-center mb-12 max-w-3xl mx-auto">
              Scale your outreach and land high-value clients with AI-powered video
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <UseCaseCard
                icon="🚀"
                title="Scale Your Agency"
                description="Create personalized video pitches at scale with AI templates"
                features={[
                  'Bulk personalization',
                  'AI-generated scripts',
                  'Multi-language support'
                ]}
                delay={0.1}
              />
              <UseCaseCard
                icon="💼"
                title="Land Executive Roles"
                description="Stand out with personalized video applications"
                features={[
                  'Presentation coaching',
                  'Professional B-roll',
                  'Engagement optimization'
                ]}
                delay={0.3}
              />
              <UseCaseCard
                icon="📈"
                title="Close More Deals"
                description="Increase response rates by 300% with video emails"
                features={[
                  'Real-time analytics',
                  'Engagement prediction',
                  'SEO-optimized content'
                ]}
                delay={0.5}
              />
            </div>
          </div>
        </div>

        {/* Features Section with Tabs */}
        <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">Powered by Google's Advanced AI</h2>
          <p className="text-xl text-gray-400 text-center mb-12">
            All the tools you need to create, optimize, and scale professional video content
          </p>

          {/* Feature Tabs */}
          <div className="flex justify-center gap-4 mb-12 flex-wrap">
            <TabButton
              active={activeTab === 'features'}
              onClick={() => setActiveTab('features')}
              color="blue"
            >
              Core Features
            </TabButton>
            <TabButton
              active={activeTab === 'ai'}
              onClick={() => setActiveTab('ai')}
              color="green"
            >
              AI Capabilities
            </TabButton>
            <TabButton
              active={activeTab === 'workflow'}
              onClick={() => setActiveTab('workflow')}
              color="blue"
            >
              Workflow Tools
            </TabButton>
          </div>

          {/* Tab Content */}
          <div className="min-h-[500px]">
            {activeTab === 'features' && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                <FeatureCard icon="🎥" title="Video Recording" description="Professional in-browser recording with take comparison" />
                <FeatureCard icon="✂️" title="Video Editing" description="Trim, crop, and edit with intuitive timeline" />
                <FeatureCard icon="📧" title="Email Integration" description="Send videos directly or generate shareable links" />
                <FeatureCard icon="🎨" title="Custom Thumbnails" description="AI-powered thumbnail selection" />
                <FeatureCard icon="📊" title="Analytics Dashboard" description="Track views, watch time, completion rates" />
                <FeatureCard icon="📱" title="Responsive Design" description="Works on desktop, tablet, and mobile" />
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                <FeatureCard icon="🎬" title="Veo Video Generation" description="4-8 second videos with 4 AI models" highlight="4 Models" />
                <FeatureCard icon="📑" title="Smart Chapters" description="Auto-detect topic transitions" highlight="Gemini 2.5" />
                <FeatureCard icon="🎯" title="SEO Optimizer" description="Generate optimized titles and descriptions" highlight="AI-Powered" />
                <FeatureCard icon="📈" title="Engagement Prediction" description="Predict drop-off points before publishing" highlight="Predictive" />
                <FeatureCard icon="🌍" title="Multi-Language" description="Translate into 9+ languages" highlight="9+ Languages" />
                <FeatureCard icon="🎓" title="Presentation Coach" description="Real-time feedback on delivery" highlight="Live AI" />
                <FeatureCard icon="🎤" title="Voice Analysis" description="Analyze voice for consistent branding" highlight="Voice AI" />
                <FeatureCard icon="🖼️" title="Scene Generation" description="Generate backgrounds with Imagen 3" highlight="Imagen 3" />
                <FeatureCard icon="🤖" title="AI Assistant" description="Get script suggestions and optimization tips" highlight="Chat AI" />
              </div>
            )}

            {activeTab === 'workflow' && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                <FeatureCard icon="📋" title="50+ Templates" description="Pre-built prompts for every use case" highlight="50 Prompts" />
                <FeatureCard icon="👥" title="Team Collaboration" description="Share and collect timestamped feedback" />
                <FeatureCard icon="🔄" title="Batch Processing" description="Process multiple videos at once" />
                <FeatureCard icon="📚" title="Video Library" description="Organize and manage all your videos" />
                <FeatureCard icon="🔗" title="Zapier Integration" description="Connect with 5,000+ apps" />
                <FeatureCard icon="🎬" title="Script Editor" description="Write and generate scripts with AI" />
              </div>
            )}
          </div>
        </div>

        {/* Animated How It Works */}
        <div className="bg-gray-800/20 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">How It Works</h2>
            <p className="text-xl text-gray-400 text-center mb-16">
              Get started in minutes, no technical skills required
            </p>

            <div className="relative">
              {/* Connection Lines */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-green-600 to-blue-600 transform -translate-y-1/2 opacity-30"></div>

              <div className="grid md:grid-cols-4 gap-8 relative z-10">
                <StepCard number={1} title="Record Video" description="Use your webcam or upload existing content" color="blue" delay={0.1} />
                <StepCard number={2} title="Enhance with AI" description="Apply chapters, SEO, translations, B-roll" color="green" delay={0.2} />
                <StepCard number={3} title="Personalize" description="Create custom versions for each recipient" color="blue" delay={0.3} />
                <StepCard number={4} title="Send & Track" description="Send via email and track engagement" color="green" delay={0.4} />
              </div>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">Built with Cutting-Edge Technology</h2>
          <p className="text-xl text-gray-400 text-center mb-12">
            Powered by Google's most advanced AI models
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <TechCard icon="🤖" title="Gemini 2.5 Pro" subtitle="Video analysis & SEO" delay={0.1} />
            <TechCard icon="⚡" title="Gemini 2.5 Flash" subtitle="Fast translations" delay={0.2} />
            <TechCard icon="🎬" title="Veo 2" subtitle="Video generation" delay={0.3} />
            <TechCard icon="🖼️" title="Imagen 3" subtitle="Scene generation" delay={0.4} />
          </div>
        </div>

        {/* Final CTA */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="relative bg-gradient-to-r from-blue-600 to-green-600 rounded-3xl p-12 md:p-16 text-center overflow-hidden group">
            {/* Animated Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-green-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-green-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 animate-fadeInUp">
                Ready to Scale Your Business?
              </h2>
              <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                Join solopreneurs and agencies using AI-powered video to close deals and land executive positions
              </p>
              <button
                onClick={onGetStarted}
                className="relative px-12 py-6 bg-white text-blue-600 text-xl font-bold rounded-xl overflow-hidden group/button animate-fadeInUp"
                style={{ animationDelay: '0.4s' }}
              >
                <span className="relative z-10">Start Creating Videos Now</span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white transform scale-x-0 group-hover/button:scale-x-100 transition-transform origin-left duration-300"></div>
              </button>
              <p className="text-sm mt-6 text-blue-100 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
                No credit card required • Set up in under 2 minutes • 50+ AI prompts included
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 py-12 bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-gray-400 text-sm">
              <p className="mb-4">Built for solopreneurs and agencies to scale their outreach and close high-value deals</p>
              <p className="text-xs text-gray-500">Powered by Google Gemini, Veo 2, and Imagen 3</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components

const FeaturePreviewCard: React.FC<{ icon: string; title: string; description: string; delay: number }> = ({ icon, title, description, delay }) => (
  <div
    className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 group animate-fadeInUp"
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="text-4xl mb-3 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">{icon}</div>
    <h3 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors duration-300">{title}</h3>
    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{description}</p>
  </div>
);

const StatCard: React.FC<{ number: number; suffix: string; label: string; color: 'blue' | 'green' }> = ({ number, suffix, label, color }) => (
  <div className="text-center group cursor-default">
    <div className={`text-4xl md:text-5xl font-bold mb-2 transition-all duration-300 group-hover:scale-110 ${color === 'blue' ? 'text-blue-400 group-hover:text-blue-300' : 'text-green-400 group-hover:text-green-300'}`}>
      {number}{suffix}
    </div>
    <div className="text-gray-400 transition-all duration-300 group-hover:text-gray-300">{label}</div>
  </div>
);

const InteractiveDemo: React.FC<{ title: string; description: string; demoType: 'prompt' | 'generation' }> = ({ title, description, demoType }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative bg-gray-800/50 border border-gray-700 rounded-2xl p-8 overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative z-10">
        <h3 className="text-2xl font-bold mb-3">{title}</h3>
        <p className="text-gray-400 mb-6">{description}</p>

        {/* Demo Visualization */}
        <div className="bg-gray-900/50 rounded-xl p-6 min-h-[200px] flex items-center justify-center border border-gray-700/50">
          {demoType === 'prompt' ? (
            <div className="w-full space-y-3">
              <div className={`h-4 bg-gradient-to-r from-blue-500 to-transparent rounded transition-all duration-1000 ${isHovered ? 'w-full' : 'w-0'}`}></div>
              <div className={`h-4 bg-gradient-to-r from-green-500 to-transparent rounded transition-all duration-1000 delay-200 ${isHovered ? 'w-4/5' : 'w-0'}`}></div>
              <div className={`h-4 bg-gradient-to-r from-blue-500 to-transparent rounded transition-all duration-1000 delay-400 ${isHovered ? 'w-3/5' : 'w-0'}`}></div>
            </div>
          ) : (
            <div className="relative w-32 h-32">
              <div className={`absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full transition-all duration-1000 ${isHovered ? 'animate-spin' : ''}`}></div>
              <div className="absolute inset-4 bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">🎬</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </div>
  );
};

const UseCaseCard: React.FC<{ icon: string; title: string; description: string; features: string[]; delay: number }> = ({ icon, title, description, features, delay }) => (
  <div
    className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-blue-500 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 group animate-fadeInUp"
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="text-5xl mb-4 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12">{icon}</div>
    <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-400 transition-colors duration-300">{title}</h3>
    <p className="text-gray-400 mb-4 group-hover:text-gray-300 transition-colors duration-300">{description}</p>
    <ul className="space-y-2 text-sm text-gray-300">
      {features.map((feature, i) => (
        <li key={i} className="flex items-center gap-2 transition-transform duration-300 hover:translate-x-1">
          <span className="text-blue-400">✓</span>
          {feature}
        </li>
      ))}
    </ul>
  </div>
);

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  highlight?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, highlight }) => (
  <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-blue-500 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 group cursor-pointer">
    <div className="text-4xl mb-3 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-6">{icon}</div>
    <div className="flex items-center gap-2 mb-2">
      <h3 className="text-xl font-bold transition-colors duration-300 group-hover:text-blue-400">{title}</h3>
      {highlight && (
        <span className="text-xs px-2 py-1 bg-blue-600/80 backdrop-blur-sm rounded-full transition-all duration-300 group-hover:bg-blue-500 group-hover:scale-110">{highlight}</span>
      )}
    </div>
    <p className="text-gray-400 text-sm transition-colors duration-300 group-hover:text-gray-300">{description}</p>
  </div>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; color: 'blue' | 'green'; children: React.ReactNode }> = ({ active, onClick, color, children }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
      active
        ? `bg-${color}-600 text-white shadow-lg shadow-${color}-500/50`
        : 'bg-gray-800/50 backdrop-blur-sm text-gray-300 hover:bg-gray-700/50 border border-gray-700'
    }`}
  >
    {children}
  </button>
);

const StepCard: React.FC<{ number: number; title: string; description: string; color: 'blue' | 'green'; delay: number }> = ({ number, title, description, color, delay }) => (
  <div className={`text-center group animate-fadeInUp`} style={{ animationDelay: `${delay}s` }}>
    <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl font-bold transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 ${
      color === 'blue'
        ? 'bg-gradient-to-br from-blue-600 to-blue-500 group-hover:shadow-lg group-hover:shadow-blue-500/50'
        : 'bg-gradient-to-br from-green-600 to-green-500 group-hover:shadow-lg group-hover:shadow-green-500/50'
    }`}>
      {number}
    </div>
    <h3 className="text-xl font-bold mb-2 transition-colors duration-300 group-hover:text-blue-400">{title}</h3>
    <p className="text-gray-400 transition-colors duration-300 group-hover:text-gray-300">{description}</p>
  </div>
);

const TechCard: React.FC<{ icon: string; title: string; subtitle: string; delay: number }> = ({ icon, title, subtitle, delay }) => (
  <div
    className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center transition-all duration-500 hover:border-blue-500 hover:transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 group animate-fadeInUp"
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="text-4xl mb-3 transition-transform duration-500 group-hover:scale-125">{icon}</div>
    <h3 className="font-bold mb-2 text-lg group-hover:text-blue-400 transition-colors duration-300">{title}</h3>
    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{subtitle}</p>
  </div>
);
