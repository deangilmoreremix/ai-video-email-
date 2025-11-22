import React, { useState, useEffect, useRef } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [liveUsers, setLiveUsers] = useState(1247);
  const [formStep, setFormStep] = useState(1);
  const [email, setEmail] = useState('');
  const statsRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({ users: 0, videos: 0, response: 0, time: 0 });
  const [hasAnimatedStats, setHasAnimatedStats] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress((scrolled / maxScroll) * 100);
      setShowStickyBar(scrolled > 600);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUsers(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);
    return () => clearInterval(interval);
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
        users: Math.floor(10000 * progress),
        videos: Math.floor(50000 * progress),
        response: Math.floor(300 * progress),
        time: Math.floor(92 * progress),
      });

      if (step >= steps) {
        clearInterval(timer);
        setStats({ users: 10000, videos: 50000, response: 300, time: 92 });
      }
    }, interval);
  };

  const testimonials = [
    { name: "Sarah Chen", role: "Agency Owner", company: "Growth Labs", image: "👩‍💼", quote: "Generated 47 qualified leads in my first week. The AI personalization is game-changing.", result: "47 leads in 7 days" },
    { name: "Marcus Johnson", role: "Sales Director", company: "TechStart Inc", image: "👨‍💼", quote: "Landed 3 enterprise deals using personalized video outreach. ROI in under 2 weeks.", result: "3 enterprise deals" },
    { name: "Emily Rodriguez", role: "Executive Coach", company: "Leadership Pro", image: "👩‍🏫", quote: "Secured my dream role at a Fortune 500 company with AI-powered video applications.", result: "Fortune 500 position" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleEmailSubmit = () => {
    if (formStep === 1 && email) {
      setFormStep(2);
    } else if (formStep === 2) {
      onGetStarted();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden relative pt-20">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-floatSlow"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-green-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-floatSlow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-floatSlow" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Sticky CTA Bar */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-600 to-green-600 py-4 px-4 shadow-2xl transform transition-transform duration-500 animate-fadeInUp">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="font-bold text-lg">Ready to 10X Your Outreach?</p>
              <p className="text-sm text-blue-100">Join 10,000+ users creating personalized videos</p>
            </div>
            <button
              onClick={onGetStarted}
              className="px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105 whitespace-nowrap"
            >
              Start Free Trial →
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10">
        {/* Hero Section - Above the Fold */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Copy */}
              <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {/* Urgency Banner */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-green-600/20 backdrop-blur-sm border border-blue-500/30 rounded-full px-4 py-2 mb-6 animate-pulse-slow">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-sm font-semibold text-green-400">{liveUsers.toLocaleString()} users created videos today</span>
                </div>

                {/* Headline - 5+1 Framework */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-blue-400 via-green-400 to-blue-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                    Stop Losing Deals
                  </span>
                  <br />
                  <span className="text-white">
                    to Generic Emails
                  </span>
                </h1>

                {/* Sub-headline with Specific Outcome */}
                <p className="text-xl sm:text-2xl text-gray-300 mb-4">
                  Create <span className="font-bold text-green-400">50 personalized AI videos</span> in the time it takes to record one
                </p>

                <p className="text-lg text-gray-400 mb-8">
                  Solopreneurs and agencies use our AI to generate personalized video emails that get <span className="font-bold text-blue-400">3X more responses</span> and close deals faster.
                </p>

                {/* Multi-step Form */}
                <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 mb-6">
                  {formStep === 1 ? (
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Email - Get your first video in 5 minutes
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                        />
                        <button
                          onClick={handleEmailSubmit}
                          disabled={!email}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white font-bold rounded-lg hover:from-blue-500 hover:to-green-500 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          Continue →
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">No credit card required • Free forever plan available</p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Choose your goal
                      </label>
                      <div className="space-y-2">
                        <button
                          onClick={handleEmailSubmit}
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-left hover:bg-gray-600/50 hover:border-blue-500 transition-all duration-300 group"
                        >
                          <span className="font-semibold group-hover:text-blue-400 transition-colors">Scale my agency</span>
                          <span className="text-sm text-gray-400 block">Create personalized outreach at scale</span>
                        </button>
                        <button
                          onClick={handleEmailSubmit}
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-left hover:bg-gray-600/50 hover:border-blue-500 transition-all duration-300 group"
                        >
                          <span className="font-semibold group-hover:text-blue-400 transition-colors">Land executive role</span>
                          <span className="text-sm text-gray-400 block">Stand out with video applications</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>4-8 second AI videos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>50+ AI prompt templates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Enterprise-grade security</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Hero Visual */}
              <div className="relative animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                <div className="relative bg-gradient-to-br from-blue-600/20 to-green-600/20 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 overflow-hidden group hover:border-blue-500/50 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Mock Video Player */}
                  <div className="relative z-10 bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
                    <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-green-600/20"></div>
                      <div className="relative z-10 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:scale-110 transition-transform duration-300">
                          <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                        <p className="text-gray-400 text-sm font-semibold">Watch 60-Second Demo</p>
                        <p className="text-gray-500 text-xs mt-1">See how Sarah generated 47 leads in 7 days</p>
                      </div>
                    </div>
                  </div>

                  {/* Floating Stats */}
                  <div className="absolute -bottom-4 -right-4 bg-gray-800/90 backdrop-blur-xl border border-gray-700 rounded-xl p-4 shadow-2xl animate-float">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-500 rounded-full flex items-center justify-center">
                        <span className="text-2xl">📈</span>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-400">+300%</p>
                        <p className="text-xs text-gray-400">Response Rate</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-6 flex items-center justify-center gap-6 flex-wrap">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">POWERED BY</div>
                    <div className="text-sm font-bold text-gray-400">Google Gemini</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">VIDEO AI</div>
                    <div className="text-sm font-bold text-gray-400">Veo 2</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">SECURITY</div>
                    <div className="text-sm font-bold text-gray-400">SOC 2 Compliant</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Band */}
        <section className="bg-gray-800/30 backdrop-blur-xl border-y border-gray-700/50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-400 mb-6">Trusted by solopreneurs and agencies at</p>
            <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap opacity-60">
              <div className="text-2xl font-bold text-gray-500">TechCrunch</div>
              <div className="text-2xl font-bold text-gray-500">Forbes</div>
              <div className="text-2xl font-bold text-gray-500">Inc.</div>
              <div className="text-2xl font-bold text-gray-500">Fast Co.</div>
            </div>
          </div>
        </section>

        {/* Outcome-Focused Stats */}
        <section ref={statsRef} className="py-20 bg-gray-800/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Real Results From Real Users</h2>
              <p className="text-xl text-gray-400">Join thousands of professionals closing more deals</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard number={stats.users.toLocaleString()} suffix="+" label="Active Users" sublabel="Growing daily" color="blue" />
              <StatCard number={stats.videos.toLocaleString()} suffix="+" label="Videos Created" sublabel="This month" color="green" />
              <StatCard number={stats.response} suffix="%" label="Avg Response Rate" sublabel="vs 1% email" color="blue" />
              <StatCard number={stats.time} suffix="%" label="Time Saved" sublabel="vs manual videos" color="green" />
            </div>
          </div>
        </section>

        {/* Testimonial Carousel */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Success Stories</h2>
              <p className="text-xl text-gray-400">See how professionals like you are winning with AI video</p>
            </div>

            <div className="relative">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`transition-all duration-500 ${
                    index === activeTestimonial ? 'opacity-100 scale-100' : 'opacity-0 scale-95 absolute inset-0'
                  }`}
                >
                  <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 sm:p-12">
                    <div className="flex items-start gap-6 mb-6">
                      <div className="text-6xl">{testimonial.image}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <p className="text-xl sm:text-2xl text-white mb-4 italic">"{testimonial.quote}"</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white">{testimonial.name}</p>
                            <p className="text-sm text-gray-400">{testimonial.role} at {testimonial.company}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-400">{testimonial.result}</p>
                            <p className="text-xs text-gray-500">Verified result</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Indicator Dots */}
              <div className="flex justify-center gap-2 mt-6">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === activeTestimonial ? 'w-8 bg-blue-500' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Problem-Solution Section */}
        <section className="py-20 bg-gray-800/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Stop Wasting Time on Low-Response Outreach</h2>
              <p className="text-xl text-gray-400">The old way doesn't work anymore</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Before Column */}
              <div className="bg-red-900/10 border border-red-500/30 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">❌</span>
                  </div>
                  <h3 className="text-2xl font-bold text-red-400">Without AI Video</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">•</span>
                    <span className="text-gray-300">Spend hours recording individual videos for each prospect</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">•</span>
                    <span className="text-gray-300">1% response rate from generic text emails</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">•</span>
                    <span className="text-gray-300">Limited reach due to manual video creation time</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">•</span>
                    <span className="text-gray-300">No analytics or engagement data</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 mt-1">•</span>
                    <span className="text-gray-300">Lose deals to competitors with better outreach</span>
                  </li>
                </ul>
              </div>

              {/* After Column */}
              <div className="bg-green-900/10 border border-green-500/30 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                  <h3 className="text-2xl font-bold text-green-400">With AI Video Assistant</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-gray-300">Create 50 personalized videos from one recording</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-gray-300">3X higher response rates with video emails</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-gray-300">Scale personalized outreach to hundreds of prospects</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-gray-300">Real-time analytics on views and engagement</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-gray-300">Close more deals and land dream positions</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-center mt-12">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white text-lg font-bold rounded-xl hover:from-blue-500 hover:to-green-500 transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/20"
              >
                Start Creating Better Videos Now →
              </button>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Get Started in 3 Simple Steps</h2>
              <p className="text-xl text-gray-400">From zero to personalized videos in under 5 minutes</p>
            </div>

            <div className="relative">
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-green-600 to-blue-600 transform -translate-y-1/2 opacity-30"></div>

              <div className="grid md:grid-cols-3 gap-8 relative z-10">
                <ProcessStep
                  number={1}
                  title="Record Once"
                  description="Use your webcam or upload a video. Our AI handles the rest."
                  icon="🎥"
                  color="blue"
                />
                <ProcessStep
                  number={2}
                  title="Personalize with AI"
                  description="Generate 50+ variations with AI prompts and B-roll in seconds."
                  icon="🤖"
                  color="green"
                />
                <ProcessStep
                  number={3}
                  title="Send & Track"
                  description="Send via email and watch real-time analytics on every view."
                  icon="📊"
                  color="blue"
                />
              </div>
            </div>

            <div className="text-center mt-12">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white text-lg font-bold rounded-xl hover:from-blue-500 hover:to-green-500 transition-all duration-300 hover:scale-105"
              >
                Try It Free - No Credit Card Required
              </button>
              <p className="text-sm text-gray-500 mt-4">Set up in under 2 minutes • Cancel anytime</p>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-gray-800/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need to Close More Deals</h2>
              <p className="text-xl text-gray-400">Powered by Google's most advanced AI models</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard icon="🎬" title="Veo 2 Video Generation" description="4-8 second AI-generated videos with 4 model options" highlight="NEW" />
              <FeatureCard icon="🎯" title="Smart Prompt Library" description="50+ pre-built templates for every use case" />
              <FeatureCard icon="📧" title="Email Integration" description="Send directly or generate shareable links" />
              <FeatureCard icon="📊" title="Real-Time Analytics" description="Track views, completion rates, and engagement" />
              <FeatureCard icon="🌍" title="Multi-Language" description="Translate into 9+ languages instantly" />
              <FeatureCard icon="🎓" title="Presentation Coach" description="Real-time AI feedback on delivery" highlight="AI" />
              <FeatureCard icon="🖼️" title="AI B-Roll Generation" description="Generate backgrounds with Imagen 3" />
              <FeatureCard icon="🔄" title="Batch Processing" description="Create multiple variations at once" />
              <FeatureCard icon="📑" title="Auto Chapters" description="AI detects topic transitions automatically" />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-xl text-gray-400">Everything you need to know</p>
            </div>

            <div className="space-y-4">
              <FAQItem
                question="How quickly can I create my first video?"
                answer="You can create your first personalized video in under 5 minutes. Simply record or upload a base video, and our AI will help you generate variations instantly."
              />
              <FAQItem
                question="Do I need technical skills or video editing experience?"
                answer="No technical skills required. Our interface is designed for complete beginners. If you can use email, you can create professional AI videos."
              />
              <FAQItem
                question="How much does it cost?"
                answer="We offer a free forever plan to get started. Paid plans start at $29/month with unlimited videos and advanced features. No credit card required to try."
              />
              <FAQItem
                question="What's the quality of the AI-generated videos?"
                answer="We use Google's Veo 2, the most advanced video generation model available. Videos are 1080p quality and indistinguishable from professionally recorded content."
              />
              <FAQItem
                question="Can I use this for my agency clients?"
                answer="Absolutely! Our agency plan includes white-label options, client management, and bulk video creation tools. Many agencies use us to offer video services."
              />
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative bg-gradient-to-r from-blue-600 to-green-600 rounded-3xl p-12 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-green-500/20"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-green-600 rounded-3xl blur-xl opacity-50"></div>

              <div className="relative z-10 text-center">
                <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                  Ready to 10X Your Outreach?
                </h2>
                <p className="text-xl mb-8 text-blue-100">
                  Join 10,000+ professionals using AI video to close more deals and land dream positions
                </p>

                {/* Benefit Stack */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 text-left max-w-2xl mx-auto">
                  <p className="font-bold mb-4 text-center text-lg">When you start today, you get:</p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>50+ AI prompt templates worth $497</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Unlimited video generation and storage</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Real-time analytics and engagement tracking</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>24/7 support and video tutorials</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={onGetStarted}
                  className="px-12 py-5 bg-white text-blue-600 text-xl font-bold rounded-xl hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-2xl mb-6"
                >
                  Start Creating Videos Now - It's Free
                </button>

                {/* Guarantee */}
                <div className="flex items-center justify-center gap-3 text-sm text-blue-100">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>30-day money-back guarantee • No credit card required • Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-800 py-12 bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-gray-400 mb-4">
                Built for solopreneurs and agencies to scale their outreach and close high-value deals
              </p>
              <p className="text-sm text-gray-500">
                Powered by Google Gemini 2.5, Veo 2, and Imagen 3 • SOC 2 Compliant • GDPR Ready
              </p>
              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Contact Support</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ number: string | number; suffix: string; label: string; sublabel: string; color: 'blue' | 'green' }> = ({ number, suffix, label, sublabel, color }) => (
  <div className="text-center group cursor-default bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:scale-105">
    <div className={`text-4xl md:text-5xl font-bold mb-2 transition-all duration-300 group-hover:scale-110 ${color === 'blue' ? 'text-blue-400' : 'text-green-400'}`}>
      {number}{suffix}
    </div>
    <div className="font-semibold text-white mb-1">{label}</div>
    <div className="text-sm text-gray-500">{sublabel}</div>
  </div>
);

const ProcessStep: React.FC<{ number: number; title: string; description: string; icon: string; color: 'blue' | 'green' }> = ({ number, title, description, icon, color }) => (
  <div className="text-center group">
    <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-3xl font-bold transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 ${
      color === 'blue'
        ? 'bg-gradient-to-br from-blue-600 to-blue-500 group-hover:shadow-lg group-hover:shadow-blue-500/50'
        : 'bg-gradient-to-br from-green-600 to-green-500 group-hover:shadow-lg group-hover:shadow-green-500/50'
    }`}>
      <span className="text-4xl">{icon}</span>
    </div>
    <h3 className="text-xl font-bold mb-3 transition-colors duration-300 group-hover:text-blue-400">{title}</h3>
    <p className="text-gray-400 transition-colors duration-300 group-hover:text-gray-300">{description}</p>
  </div>
);

const FeatureCard: React.FC<{ icon: string; title: string; description: string; highlight?: string }> = ({ icon, title, description, highlight }) => (
  <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-blue-500 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 group">
    <div className="flex items-start justify-between mb-3">
      <span className="text-4xl transition-transform duration-500 group-hover:scale-125 group-hover:rotate-6">{icon}</span>
      {highlight && (
        <span className="text-xs px-2 py-1 bg-blue-600 rounded-full font-bold">{highlight}</span>
      )}
    </div>
    <h3 className="text-lg font-bold mb-2 transition-colors duration-300 group-hover:text-blue-400">{title}</h3>
    <p className="text-sm text-gray-400 transition-colors duration-300 group-hover:text-gray-300">{description}</p>
  </div>
);

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-800/50 transition-colors"
      >
        <span className="font-semibold text-white">{question}</span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="px-6 pb-4 text-gray-400">
          {answer}
        </div>
      </div>
    </div>
  );
};
