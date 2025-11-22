import React, { useState, useEffect, useRef, useCallback } from 'react';

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
  const [typedText, setTypedText] = useState('');
  const [typeIndex, setTypeIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [recentSignups, setRecentSignups] = useState<Array<{ name: string; time: string }>>([]);
  const [activeTab, setActiveTab] = useState<'agencies' | 'executives' | 'sales'>('agencies');
  const [roiValue, setRoiValue] = useState(50);
  const [showVideo, setShowVideo] = useState(false);

  const statsRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({ users: 0, videos: 0, response: 0, time: 0 });
  const [hasAnimatedStats, setHasAnimatedStats] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);

  const phrases = [
    'Stop Losing Deals to Generic Emails',
    'Scale Your Agency with AI Video',
    'Land Your Dream Executive Role',
    'Close 3X More Deals with Video'
  ];

  const recentSignupData = [
    { name: 'Sarah from New York', time: 'just now' },
    { name: 'Michael from London', time: '2 min ago' },
    { name: 'Jessica from San Francisco', time: '5 min ago' },
    { name: 'David from Toronto', time: '8 min ago' },
    { name: 'Emma from Sydney', time: '12 min ago' }
  ];

  useEffect(() => {
    setIsVisible(true);

    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress((scrolled / maxScroll) * 100);
      setShowStickyBar(scrolled > 600);
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !showExitIntent) {
        setShowExitIntent(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [showExitIntent]);

  useEffect(() => {
    const phraseIndex = Math.floor(typeIndex / 50) % phrases.length;
    const charIndex = typeIndex % 50;
    const currentPhrase = phrases[phraseIndex];

    if (charIndex < currentPhrase.length) {
      setTypedText(currentPhrase.substring(0, charIndex + 1));
      const timer = setTimeout(() => setTypeIndex(typeIndex + 1), 100);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setTypeIndex(typeIndex + 1), 2000);
      return () => clearTimeout(timer);
    }
  }, [typeIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUsers(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRecentSignups(prev => {
        const next = [...prev];
        next.unshift(recentSignupData[Math.floor(Math.random() * recentSignupData.length)]);
        return next.slice(0, 3);
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fadeInUp');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );

    document.querySelectorAll('.observe-animation').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
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
    { name: "Sarah Chen", role: "Agency Owner", company: "Growth Labs", image: "👩‍💼", quote: "Generated 47 qualified leads in my first week. The AI personalization is game-changing.", result: "47 leads in 7 days", video: true },
    { name: "Marcus Johnson", role: "Sales Director", company: "TechStart Inc", image: "👨‍💼", quote: "Landed 3 enterprise deals using personalized video outreach. ROI in under 2 weeks.", result: "3 enterprise deals", video: true },
    { name: "Emily Rodriguez", role: "Executive Coach", company: "Leadership Pro", image: "👩‍🏫", quote: "Secured my dream role at a Fortune 500 company with AI-powered video applications.", result: "Fortune 500 position", video: false },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleEmailSubmit = () => {
    if (formStep === 1 && email) {
      setFormStep(2);
    } else if (formStep === 2) {
      onGetStarted();
    }
  };

  const calculateROI = (hours: number) => {
    const hourlyRate = 100;
    const timeSaved = hours * 0.92;
    const monthlySavings = timeSaved * hourlyRate * 4;
    const additionalRevenue = monthlySavings * 3;
    return Math.floor(additionalRevenue);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden relative pt-20">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-800 z-50">
        <div
          className="h-full bg-gradient-to-r from-blue-600 via-green-500 to-blue-600 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Enhanced Background with Parallax */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
        <div
          className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-floatSlow"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
          }}
        ></div>
        <div
          className="absolute top-1/3 right-1/4 w-96 h-96 bg-green-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-floatSlow"
          style={{
            animationDelay: '2s',
            transform: `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px)`
          }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-floatSlow"
          style={{
            animationDelay: '4s',
            transform: `translate(${mousePosition.x * 0.015}px, ${mousePosition.y * 0.015}px)`
          }}
        ></div>

        {/* Enhanced Floating Particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 3 === 0 ? '#60a5fa' : i % 3 === 1 ? '#34d399' : '#818cf8',
              opacity: Math.random() * 0.5 + 0.2,
              animation: `particle ${10 + Math.random() * 20}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Sticky CTA Bar with Animation */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-600 to-green-600 py-4 px-4 shadow-2xl transform transition-all duration-500 animate-slideInUp">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="font-bold text-lg animate-pulse">Ready to 10X Your Outreach?</p>
              <p className="text-sm text-blue-100">Join {liveUsers.toLocaleString()}+ users creating personalized videos</p>
            </div>
            <button
              onClick={onGetStarted}
              className="px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105 whitespace-nowrap shadow-lg hover:shadow-xl group"
            >
              <span className="inline-flex items-center gap-2">
                Start Free Trial
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Exit Intent Popup */}
      {showExitIntent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 max-w-lg mx-4 border border-blue-500/50 shadow-2xl animate-scaleIn">
            <button
              onClick={() => setShowExitIntent(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">🎁</div>
              <h3 className="text-3xl font-bold mb-4">Wait! Special Offer</h3>
              <p className="text-xl text-gray-300 mb-6">
                Get <span className="text-green-400 font-bold">50% off</span> your first month +
                <span className="text-blue-400 font-bold"> 100 bonus AI credits</span>
              </p>
              <button
                onClick={() => {
                  setShowExitIntent(false);
                  onGetStarted();
                }}
                className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white text-lg font-bold rounded-xl hover:from-blue-500 hover:to-green-500 transition-all duration-300 hover:scale-105 mb-4"
              >
                Claim My Discount Now
              </button>
              <p className="text-sm text-gray-500">Limited time offer • No credit card required</p>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Signup Notifications */}
      <div className="fixed bottom-24 left-4 z-30 space-y-2">
        {recentSignups.map((signup, index) => (
          <div
            key={`${signup.name}-${index}`}
            className="bg-gray-800/90 backdrop-blur-xl border border-gray-700 rounded-xl px-4 py-3 shadow-xl animate-slideInLeft"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-semibold text-white">{signup.name}</p>
                <p className="text-xs text-gray-400">Started their free trial • {signup.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10">
        {/* Enhanced Hero Section */}
        <section ref={heroRef} className="relative overflow-hidden min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column */}
              <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {/* Live Activity Badge */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-green-600/20 backdrop-blur-sm border border-blue-500/30 rounded-full px-4 py-2 mb-6 animate-pulse-slow">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-sm font-semibold text-green-400">{liveUsers.toLocaleString()} users created videos today</span>
                </div>

                {/* Animated Typing Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight min-h-[180px]">
                  <span className="bg-gradient-to-r from-blue-400 via-green-400 to-blue-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                    {typedText}
                    <span className="animate-blink">|</span>
                  </span>
                </h1>

                {/* Value Proposition */}
                <div className="space-y-4 mb-8">
                  <p className="text-xl sm:text-2xl text-gray-300 flex items-center gap-3 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                    <span className="text-3xl">🚀</span>
                    Create <span className="font-bold text-green-400 mx-2">50 personalized AI videos</span> in the time it takes to record one
                  </p>
                  <p className="text-lg text-gray-400 flex items-center gap-3 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                    <span className="text-2xl">📈</span>
                    Get <span className="font-bold text-blue-400 mx-2">3X more responses</span> and close deals faster
                  </p>
                  <p className="text-lg text-gray-400 flex items-center gap-3 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
                    <span className="text-2xl">⚡</span>
                    Generate videos in <span className="font-bold text-green-400 mx-2">4-8 seconds</span> with Google's Veo 2
                  </p>
                </div>

                {/* Enhanced Multi-step Form */}
                <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 mb-6 hover:border-blue-500/50 transition-all duration-300 animate-fadeInUp" style={{ animationDelay: '0.8s' }}>
                  {formStep === 1 ? (
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        ✉️ Email - Get your first video in 5 minutes
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        <button
                          onClick={handleEmailSubmit}
                          disabled={!email}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white font-bold rounded-lg hover:from-blue-500 hover:to-green-500 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-lg hover:shadow-xl group"
                        >
                          <span className="inline-flex items-center gap-2">
                            Continue
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                          </span>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        No credit card required • Free forever plan available
                      </p>
                    </div>
                  ) : (
                    <div className="animate-fadeIn">
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        🎯 Choose your goal to get personalized recommendations
                      </label>
                      <div className="space-y-2">
                        <button
                          onClick={handleEmailSubmit}
                          className="w-full px-4 py-4 bg-gray-700/50 border border-gray-600 rounded-lg text-left hover:bg-gray-600/50 hover:border-blue-500 transition-all duration-300 group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🚀</span>
                            <div className="flex-1">
                              <span className="font-semibold group-hover:text-blue-400 transition-colors block">Scale my agency</span>
                              <span className="text-sm text-gray-400 block">Create personalized outreach at scale</span>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                        <button
                          onClick={handleEmailSubmit}
                          className="w-full px-4 py-4 bg-gray-700/50 border border-gray-600 rounded-lg text-left hover:bg-gray-600/50 hover:border-blue-500 transition-all duration-300 group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">💼</span>
                            <div className="flex-1">
                              <span className="font-semibold group-hover:text-blue-400 transition-colors block">Land executive role</span>
                              <span className="text-sm text-gray-400 block">Stand out with video applications</span>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                        <button
                          onClick={handleEmailSubmit}
                          className="w-full px-4 py-4 bg-gray-700/50 border border-gray-600 rounded-lg text-left hover:bg-gray-600/50 hover:border-blue-500 transition-all duration-300 group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📈</span>
                            <div className="flex-1">
                              <span className="font-semibold group-hover:text-blue-400 transition-colors block">Close more deals</span>
                              <span className="text-sm text-gray-400 block">Increase sales with video emails</span>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Trust Indicators with Icons */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 animate-fadeInUp" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-2 group hover:text-white transition-colors cursor-default">
                    <svg className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>4-8 second videos</span>
                  </div>
                  <div className="flex items-center gap-2 group hover:text-white transition-colors cursor-default">
                    <svg className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>50+ AI templates</span>
                  </div>
                  <div className="flex items-center gap-2 group hover:text-white transition-colors cursor-default">
                    <svg className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Enterprise security</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Enhanced Visual */}
              <div className="relative animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                <div className="relative bg-gradient-to-br from-blue-600/20 to-green-600/20 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 overflow-hidden group hover:border-blue-500/50 transition-all duration-500 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Video Player with Play Button */}
                  <div className="relative z-10 bg-gray-900 rounded-xl overflow-hidden shadow-2xl cursor-pointer" onClick={() => setShowVideo(true)}>
                    <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative group/video">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-green-600/20 animate-pulse-slow"></div>

                      {/* Animated Circles */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 border-4 border-blue-500/30 rounded-full animate-ping"></div>
                        <div className="absolute w-24 h-24 border-4 border-green-500/30 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                      </div>

                      <div className="relative z-10 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:scale-110 transition-transform duration-300 shadow-2xl group-hover/video:shadow-blue-500/50">
                          <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                        <p className="text-gray-400 text-sm font-semibold">Watch 60-Second Demo</p>
                        <p className="text-gray-500 text-xs mt-1">See how Sarah generated 47 leads in 7 days</p>
                      </div>
                    </div>
                  </div>

                  {/* Floating Result Card */}
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

                  {/* Floating Time Saved Card */}
                  <div className="absolute -top-4 -left-4 bg-gray-800/90 backdrop-blur-xl border border-gray-700 rounded-xl p-3 shadow-2xl animate-float" style={{ animationDelay: '1s' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚡</span>
                      <div>
                        <p className="text-sm font-bold text-blue-400">92% Faster</p>
                        <p className="text-xs text-gray-400">Time Saved</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-8 grid grid-cols-3 gap-4">
                  <div className="text-center bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 cursor-default">
                    <div className="text-xs text-gray-500 mb-1">POWERED BY</div>
                    <div className="text-sm font-bold text-gray-300">Google Gemini</div>
                  </div>
                  <div className="text-center bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 cursor-default">
                    <div className="text-xs text-gray-500 mb-1">VIDEO AI</div>
                    <div className="text-sm font-bold text-gray-300">Veo 2</div>
                  </div>
                  <div className="text-center bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 cursor-default">
                    <div className="text-xs text-gray-500 mb-1">SECURITY</div>
                    <div className="text-sm font-bold text-gray-300">SOC 2</div>
                  </div>
                </div>

                {/* Scroll Indicator */}
                <div className="flex justify-center mt-8 animate-bounce">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* As Seen On Section */}
        <section className="bg-gray-800/30 backdrop-blur-xl border-y border-gray-700/50 py-8 observe-animation opacity-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-400 mb-6 animate-fadeInUp">As seen on and trusted by companies at</p>
            <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
              {['TechCrunch', 'Forbes', 'Inc.', 'Fast Co.', 'Wired'].map((brand, index) => (
                <div
                  key={brand}
                  className="text-2xl font-bold text-gray-500 hover:text-gray-300 transition-all duration-300 hover:scale-110 cursor-default animate-fadeInUp"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {brand}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section with Enhanced Animation */}
        <section ref={statsRef} className="py-20 bg-gray-800/20 observe-animation opacity-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 animate-fadeInUp">Real Results From Real Users</h2>
              <p className="text-xl text-gray-400 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>Join thousands of professionals closing more deals</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard number={stats.users.toLocaleString()} suffix="+" label="Active Users" sublabel="Growing daily" color="blue" delay={0} />
              <StatCard number={stats.videos.toLocaleString()} suffix="+" label="Videos Created" sublabel="This month" color="green" delay={0.1} />
              <StatCard number={stats.response} suffix="%" label="Avg Response Rate" sublabel="vs 1% email" color="blue" delay={0.2} />
              <StatCard number={stats.time} suffix="%" label="Time Saved" sublabel="vs manual videos" color="green" delay={0.3} />
            </div>
          </div>
        </section>

        {/* Interactive Demo Section */}
        <section ref={demoRef} className="py-20 observe-animation opacity-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Try It Yourself - No Signup Required</h2>
              <p className="text-xl text-gray-400">Experience the power of AI video generation</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Live Prompt Generator */}
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-500 hover:scale-105">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-4xl">🎯</span>
                  <div>
                    <h3 className="text-2xl font-bold">AI Prompt Generator</h3>
                    <p className="text-sm text-gray-400">Type your idea and watch AI create the perfect prompt</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">What type of video do you want to create?</label>
                    <input
                      type="text"
                      placeholder="E.g., Product demo for SaaS startup"
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>

                  <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4 min-h-[150px]">
                    <p className="text-sm text-gray-400 mb-2">Generated AI Prompt:</p>
                    <p className="text-white leading-relaxed">
                      "Professional presenter demonstrating innovative SaaS platform features, clean modern office background,
                      confident and enthusiastic delivery, camera slowly zooming in on key product benefits,
                      soft natural lighting, 4-8 seconds, 1080p quality"
                    </p>
                  </div>

                  <button className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white font-bold rounded-lg hover:from-blue-500 hover:to-green-500 transition-all duration-300 hover:scale-105">
                    Generate Video with This Prompt →
                  </button>
                </div>
              </div>

              {/* ROI Calculator */}
              <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-500 hover:scale-105">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-4xl">💰</span>
                  <div>
                    <h3 className="text-2xl font-bold">ROI Calculator</h3>
                    <p className="text-sm text-gray-400">See how much time and money you'll save</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Hours spent on video creation per week: {roiValue}
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={roiValue}
                      onChange={(e) => setRoiValue(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 border border-red-500/30 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-1">Without AI</p>
                      <p className="text-2xl font-bold text-red-400">{roiValue} hrs/week</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-500/30 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-1">With AI</p>
                      <p className="text-2xl font-bold text-green-400">{Math.round(roiValue * 0.08)} hrs/week</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-600/20 to-green-600/20 border border-blue-500/30 rounded-xl p-6">
                    <p className="text-sm text-gray-300 mb-2">Monthly Revenue Impact:</p>
                    <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                      ${calculateROI(roiValue).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">Based on $100/hr rate + 3X deal velocity increase</p>
                  </div>

                  <button onClick={onGetStarted} className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white font-bold rounded-lg hover:from-blue-500 hover:to-green-500 transition-all duration-300 hover:scale-105">
                    Start Saving Time Now →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Testimonials with Video */}
        <section className="py-20 bg-gray-800/20 observe-animation opacity-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Success Stories</h2>
              <p className="text-xl text-gray-400">Real results from real professionals</p>
            </div>

            <div className="relative min-h-[400px]">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`transition-all duration-500 ${
                    index === activeTestimonial ? 'opacity-100 scale-100 relative' : 'opacity-0 scale-95 absolute inset-0 pointer-events-none'
                  }`}
                >
                  <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 sm:p-12 hover:border-blue-500/50 transition-all duration-300">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-5 h-5 text-yellow-400 animate-fadeIn" style={{ animationDelay: `${i * 0.1}s` }} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="ml-2 text-sm text-gray-400">Verified Customer</span>
                        </div>

                        <p className="text-xl sm:text-2xl text-white mb-6 italic leading-relaxed">"{testimonial.quote}"</p>

                        <div className="flex items-center gap-4 mb-4">
                          <div className="text-5xl">{testimonial.image}</div>
                          <div>
                            <p className="font-bold text-white text-lg">{testimonial.name}</p>
                            <p className="text-sm text-gray-400">{testimonial.role}</p>
                            <p className="text-sm text-gray-500">{testimonial.company}</p>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-green-900/20 to-green-800/20 border border-green-500/30 rounded-xl p-4">
                          <p className="text-sm text-gray-400">Result:</p>
                          <p className="text-2xl font-bold text-green-400">{testimonial.result}</p>
                        </div>
                      </div>

                      <div>
                        {testimonial.video ? (
                          <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 flex items-center justify-center cursor-pointer group hover:border-blue-500/50 transition-all">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                </svg>
                              </div>
                              <p className="text-sm text-gray-400">Watch {testimonial.name.split(' ')[0]}'s Story</p>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-video bg-gradient-to-br from-blue-900/20 to-green-900/20 rounded-xl border border-blue-500/30 p-6 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-6xl mb-4">🎉</div>
                              <p className="text-gray-300 font-semibold">Amazing results with AI video!</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === activeTestimonial ? 'w-8 bg-blue-500' : 'w-2 bg-gray-600 hover:bg-gray-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Problem-Solution with Animation */}
        <section className="py-20 observe-animation opacity-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Stop Wasting Time on Low-Response Outreach</h2>
              <p className="text-xl text-gray-400">The old way doesn't work anymore</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-red-900/10 border border-red-500/30 rounded-2xl p-8 hover:scale-105 transition-transform duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-2xl">❌</span>
                  </div>
                  <h3 className="text-2xl font-bold text-red-400">Without AI Video</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    'Spend hours recording individual videos for each prospect',
                    '1% response rate from generic text emails',
                    'Limited reach due to manual video creation time',
                    'No analytics or engagement data',
                    'Lose deals to competitors with better outreach'
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3 animate-fadeInUp" style={{ animationDelay: `${index * 0.1}s` }}>
                      <span className="text-red-400 mt-1 text-xl">•</span>
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-green-900/10 border border-green-500/30 rounded-2xl p-8 hover:scale-105 transition-transform duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-2xl">✅</span>
                  </div>
                  <h3 className="text-2xl font-bold text-green-400">With AI Video Assistant</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    'Create 50 personalized videos from one recording',
                    '3X higher response rates with video emails',
                    'Scale personalized outreach to hundreds of prospects',
                    'Real-time analytics on views and engagement',
                    'Close more deals and land dream positions'
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3 animate-fadeInUp" style={{ animationDelay: `${index * 0.1}s` }}>
                      <span className="text-green-400 mt-1 text-xl">✓</span>
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-center mt-12">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white text-lg font-bold rounded-xl hover:from-blue-500 hover:to-green-500 transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/20 group"
              >
                <span className="inline-flex items-center gap-2">
                  Start Creating Better Videos Now
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Use Case Tabs */}
        <section className="py-20 bg-gray-800/20 observe-animation opacity-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built For Your Success</h2>
              <p className="text-xl text-gray-400">Choose your path to growth</p>
            </div>

            <div className="flex justify-center gap-4 mb-12">
              {[
                { key: 'agencies' as const, label: '🚀 Agencies', icon: '🚀' },
                { key: 'executives' as const, label: '💼 Executives', icon: '💼' },
                { key: 'sales' as const, label: '📈 Sales Teams', icon: '📈' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white scale-105 shadow-lg'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-h-[400px]">
              {activeTab === 'agencies' && (
                <div className="animate-fadeIn">
                  <div className="grid md:grid-cols-3 gap-6">
                    <UseCaseCard
                      icon="📧"
                      title="Bulk Personalization"
                      description="Create 100+ personalized videos from one master recording"
                      features={['Dynamic name insertion', 'Company-specific messages', 'Automated delivery']}
                    />
                    <UseCaseCard
                      icon="🎨"
                      title="Brand Customization"
                      description="White-label with your agency's branding"
                      features={['Custom logos', 'Brand colors', 'Client portals']}
                    />
                    <UseCaseCard
                      icon="📊"
                      title="Client Reporting"
                      description="Detailed analytics for every campaign"
                      features={['View tracking', 'Engagement metrics', 'ROI reports']}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'executives' && (
                <div className="animate-fadeIn">
                  <div className="grid md:grid-cols-3 gap-6">
                    <UseCaseCard
                      icon="🎯"
                      title="Personal Branding"
                      description="Stand out in competitive job markets"
                      features={['Professional templates', 'Executive coaching', 'Portfolio building']}
                    />
                    <UseCaseCard
                      icon="🎓"
                      title="Presentation Skills"
                      description="AI-powered delivery feedback"
                      features={['Tone analysis', 'Pace optimization', 'Body language tips']}
                    />
                    <UseCaseCard
                      icon="💼"
                      title="Application Videos"
                      description="Personalized videos for dream roles"
                      features={['Company research', 'Role-specific messaging', 'Follow-up sequences']}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'sales' && (
                <div className="animate-fadeIn">
                  <div className="grid md:grid-cols-3 gap-6">
                    <UseCaseCard
                      icon="🎯"
                      title="Prospecting"
                      description="Warm up cold leads with video"
                      features={['Personalized intros', 'Pain point messaging', 'Call-to-action optimization']}
                    />
                    <UseCaseCard
                      icon="🤝"
                      title="Demo Videos"
                      description="Product demos that convert"
                      features={['Feature highlights', 'Use case scenarios', 'Objection handling']}
                    />
                    <UseCaseCard
                      icon="📈"
                      title="Follow-ups"
                      description="Automated nurture sequences"
                      features={['Triggered sends', 'Engagement tracking', 'Smart timing']}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* How It Works with Timeline */}
        <section className="py-20 observe-animation opacity-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Get Started in 3 Simple Steps</h2>
              <p className="text-xl text-gray-400">From zero to personalized videos in under 5 minutes</p>
            </div>

            <div className="relative">
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-green-600 to-blue-600 transform -translate-y-1/2 opacity-30 animate-pulse-slow"></div>

              <div className="grid md:grid-cols-3 gap-8 relative z-10">
                <ProcessStep number={1} title="Record Once" description="Use your webcam or upload a video. Our AI handles the rest." icon="🎥" color="blue" delay={0} />
                <ProcessStep number={2} title="Personalize with AI" description="Generate 50+ variations with AI prompts and B-roll in seconds." icon="🤖" color="green" delay={0.2} />
                <ProcessStep number={3} title="Send & Track" description="Send via email and watch real-time analytics on every view." icon="📊" color="blue" delay={0.4} />
              </div>
            </div>

            <div className="text-center mt-12">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white text-lg font-bold rounded-xl hover:from-blue-500 hover:to-green-500 transition-all duration-300 hover:scale-105 group"
              >
                <span className="inline-flex items-center gap-2">
                  Try It Free - No Credit Card Required
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </button>
              <p className="text-sm text-gray-500 mt-4">Set up in under 2 minutes • Cancel anytime</p>
            </div>
          </div>
        </section>

        {/* Features Grid with Hover Effects */}
        <section className="py-20 bg-gray-800/20 observe-animation opacity-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need to Close More Deals</h2>
              <p className="text-xl text-gray-400">Powered by Google's most advanced AI models</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: "🎬", title: "Veo 2 Video Generation", description: "4-8 second AI-generated videos with 4 model options", highlight: "NEW" },
                { icon: "🎯", title: "Smart Prompt Library", description: "50+ pre-built templates for every use case", highlight: "" },
                { icon: "📧", title: "Email Integration", description: "Send directly or generate shareable links", highlight: "" },
                { icon: "📊", title: "Real-Time Analytics", description: "Track views, completion rates, and engagement", highlight: "" },
                { icon: "🌍", title: "Multi-Language", description: "Translate into 9+ languages instantly", highlight: "" },
                { icon: "🎓", title: "Presentation Coach", description: "Real-time AI feedback on delivery", highlight: "AI" },
                { icon: "🖼️", title: "AI B-Roll Generation", description: "Generate backgrounds with Imagen 3", highlight: "" },
                { icon: "🔄", title: "Batch Processing", description: "Create multiple variations at once", highlight: "" },
                { icon: "📑", title: "Auto Chapters", description: "AI detects topic transitions automatically", highlight: "" }
              ].map((feature, index) => (
                <FeatureCard key={index} {...feature} delay={index * 0.05} />
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 observe-animation opacity-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-xl text-gray-400">Everything you need to know</p>
            </div>

            <div className="space-y-4">
              {[
                {
                  question: "How quickly can I create my first video?",
                  answer: "You can create your first personalized video in under 5 minutes. Simply record or upload a base video, and our AI will help you generate variations instantly."
                },
                {
                  question: "Do I need technical skills or video editing experience?",
                  answer: "No technical skills required. Our interface is designed for complete beginners. If you can use email, you can create professional AI videos."
                },
                {
                  question: "How much does it cost?",
                  answer: "We offer a free forever plan to get started. Paid plans start at $29/month with unlimited videos and advanced features. No credit card required to try."
                },
                {
                  question: "What's the quality of the AI-generated videos?",
                  answer: "We use Google's Veo 2, the most advanced video generation model available. Videos are 1080p quality and indistinguishable from professionally recorded content."
                },
                {
                  question: "Can I use this for my agency clients?",
                  answer: "Absolutely! Our agency plan includes white-label options, client management, and bulk video creation tools. Many agencies use us to offer video services."
                }
              ].map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} delay={index * 0.1} />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA with Benefit Stack */}
        <section className="py-20 observe-animation opacity-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative bg-gradient-to-r from-blue-600 to-green-600 rounded-3xl p-12 overflow-hidden hover:scale-105 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-green-500/20 animate-pulse-slow"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-green-600 rounded-3xl blur-xl opacity-50 animate-pulse"></div>

              <div className="relative z-10 text-center">
                <div className="text-6xl mb-6 animate-bounce">🚀</div>
                <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                  Ready to 10X Your Outreach?
                </h2>
                <p className="text-xl mb-8 text-blue-100">
                  Join {liveUsers.toLocaleString()}+ professionals using AI video to close more deals and land dream positions
                </p>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 text-left max-w-2xl mx-auto">
                  <p className="font-bold mb-4 text-center text-lg">When you start today, you get:</p>
                  <ul className="space-y-3">
                    {[
                      '50+ AI prompt templates worth $497',
                      'Unlimited video generation and storage',
                      'Real-time analytics and engagement tracking',
                      '24/7 support and video tutorials',
                      'Access to all 4 Veo 2 models'
                    ].map((benefit, index) => (
                      <li key={index} className="flex items-center gap-3 animate-fadeInUp" style={{ animationDelay: `${index * 0.1}s` }}>
                        <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={onGetStarted}
                  className="px-12 py-5 bg-white text-blue-600 text-xl font-bold rounded-xl hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-2xl mb-6 group"
                >
                  <span className="inline-flex items-center gap-2">
                    Start Creating Videos Now - It's Free
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </button>

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

        {/* Video Gallery Section */}
        <section className="py-20 observe-animation opacity-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Watch Real Results in Action</h2>
              <p className="text-xl text-gray-400">See how professionals are using AI video to close deals</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Sarah's Agency Growth Story", views: "12.5K", duration: "3:24", category: "Agency" },
                { title: "How Marcus Closed 3 Enterprise Deals", views: "8.2K", duration: "4:15", category: "Sales" },
                { title: "Emily Landed Her Dream Role", views: "15.1K", duration: "2:47", category: "Career" },
                { title: "Scaling Video Outreach to 1000+", views: "9.8K", duration: "5:30", category: "Tutorial" },
                { title: "AI Prompt Engineering Masterclass", views: "18.3K", duration: "6:12", category: "Education" },
                { title: "ROI Analysis: First 90 Days", views: "11.7K", duration: "4:45", category: "Analytics" }
              ].map((video, index) => (
                <div key={index} className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:scale-105 group cursor-pointer">
                  <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-green-600/10"></div>
                    <div className="relative z-10">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-bold">
                      {video.duration}
                    </div>
                  </div>
                  <div className="p-4">
                    <span className="inline-block px-2 py-1 bg-blue-600/20 text-blue-400 text-xs font-bold rounded mb-2">
                      {video.category}
                    </span>
                    <h3 className="font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{video.title}</h3>
                    <p className="text-sm text-gray-500">{video.views} views</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Case Studies Section */}
        <section className="py-20 bg-gray-800/20 observe-animation opacity-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">In-Depth Case Studies</h2>
              <p className="text-xl text-gray-400">Real metrics from real businesses</p>
            </div>

            <div className="space-y-8">
              {[
                {
                  company: "TechGrowth Agency",
                  industry: "B2B SaaS Marketing",
                  challenge: "Struggling to scale personalized outreach to 500+ prospects monthly",
                  solution: "Implemented AI video for all cold outreach campaigns",
                  results: [
                    { metric: "Response Rate", before: "1.2%", after: "4.8%", increase: "+300%" },
                    { metric: "Meeting Bookings", before: "12/month", after: "47/month", increase: "+292%" },
                    { metric: "Time Per Video", before: "45 min", after: "3 min", increase: "-93%" },
                    { metric: "Revenue Impact", before: "$50K/mo", after: "$180K/mo", increase: "+260%" }
                  ],
                  testimonial: "Game-changing for our agency. We went from manually creating 20 videos per month to 500+ with AI.",
                  avatar: "👨‍💼"
                },
                {
                  company: "Executive Talent Co",
                  industry: "Executive Recruitment",
                  challenge: "Candidates weren't standing out in competitive C-suite applications",
                  solution: "Created AI-powered video applications for all executive placements",
                  results: [
                    { metric: "Interview Rate", before: "8%", after: "31%", increase: "+288%" },
                    { metric: "Offer Rate", before: "2.1%", after: "9.4%", increase: "+348%" },
                    { metric: "Time to Placement", before: "90 days", after: "35 days", increase: "-61%" },
                    { metric: "Client Satisfaction", before: "7.2/10", after: "9.6/10", increase: "+33%" }
                  ],
                  testimonial: "Our candidates now land interviews 3X more often. The video applications are the difference-maker.",
                  avatar: "👩‍💼"
                },
                {
                  company: "CloudScale Solutions",
                  industry: "Enterprise Software Sales",
                  challenge: "Cold email response rates under 1% with generic messaging",
                  solution: "Personalized video outreach for all enterprise prospects",
                  results: [
                    { metric: "Email Open Rate", before: "18%", after: "64%", increase: "+256%" },
                    { metric: "Response Rate", before: "0.8%", after: "5.2%", increase: "+550%" },
                    { metric: "Pipeline Value", before: "$2.1M", after: "$8.7M", increase: "+314%" },
                    { metric: "Deal Velocity", before: "120 days", after: "65 days", increase: "-46%" }
                  ],
                  testimonial: "We closed more deals in Q1 using AI video than all of last year combined.",
                  avatar: "👨‍💻"
                }
              ].map((study, index) => (
                <div key={index} className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-500">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="text-5xl">{study.avatar}</div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">{study.company}</h3>
                      <p className="text-blue-400 font-semibold mb-2">{study.industry}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="md:col-span-1 bg-red-900/10 border border-red-500/30 rounded-xl p-4">
                      <p className="text-xs font-bold text-red-400 mb-2">CHALLENGE</p>
                      <p className="text-sm text-gray-300">{study.challenge}</p>
                    </div>
                    <div className="md:col-span-1 bg-blue-900/10 border border-blue-500/30 rounded-xl p-4">
                      <p className="text-xs font-bold text-blue-400 mb-2">SOLUTION</p>
                      <p className="text-sm text-gray-300">{study.solution}</p>
                    </div>
                    <div className="md:col-span-1 bg-green-900/10 border border-green-500/30 rounded-xl p-4">
                      <p className="text-xs font-bold text-green-400 mb-2">RESULT</p>
                      <div className="text-2xl font-bold text-green-400">{study.results[3].increase}</div>
                      <p className="text-xs text-gray-400">{study.results[3].metric}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {study.results.map((result, i) => (
                      <div key={i} className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">{result.metric}</p>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs text-gray-500">Before:</span>
                          <span className="text-sm font-bold text-gray-400">{result.before}</span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-xs text-gray-500">After:</span>
                          <span className="text-sm font-bold text-white">{result.after}</span>
                        </div>
                        <span className="text-lg font-bold text-green-400">{result.increase}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-900/10 border-l-4 border-blue-500 rounded-lg p-4">
                    <p className="text-gray-300 italic">"{study.testimonial}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 observe-animation opacity-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-xl text-gray-400">Start free, scale as you grow</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Starter",
                  price: "Free",
                  period: "forever",
                  description: "Perfect for testing and personal use",
                  features: [
                    "5 videos per month",
                    "Basic AI prompts",
                    "720p quality",
                    "Email sharing",
                    "Community support"
                  ],
                  cta: "Start Free",
                  popular: false
                },
                {
                  name: "Professional",
                  price: "$49",
                  period: "per month",
                  description: "For solopreneurs and small agencies",
                  features: [
                    "Unlimited videos",
                    "All AI features",
                    "1080p quality",
                    "Advanced analytics",
                    "Priority support",
                    "Custom branding",
                    "API access"
                  ],
                  cta: "Start 14-Day Trial",
                  popular: true
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  period: "contact sales",
                  description: "For large teams and agencies",
                  features: [
                    "Everything in Pro",
                    "White-label options",
                    "Dedicated account manager",
                    "Custom integrations",
                    "SLA guarantees",
                    "Training & onboarding",
                    "Volume discounts"
                  ],
                  cta: "Contact Sales",
                  popular: false
                }
              ].map((plan, index) => (
                <div
                  key={index}
                  className={`relative bg-gray-800/40 backdrop-blur-sm border rounded-2xl p-8 hover:scale-105 transition-all duration-300 ${
                    plan.popular ? 'border-blue-500 shadow-2xl shadow-blue-500/20' : 'border-gray-700 hover:border-blue-500/50'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-green-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                      Most Popular
                    </div>
                  )}

                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-gray-500">/{plan.period}</span>}
                  </div>
                  <p className="text-gray-400 mb-6">{plan.description}</p>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={onGetStarted}
                    className={`w-full py-3 rounded-lg font-bold transition-all duration-300 hover:scale-105 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white hover:from-blue-500 hover:to-green-500'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-400 mb-4">All plans include 30-day money-back guarantee</p>
              <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  No credit card required
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Cancel anytime
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Free migration help
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Integration Partners */}
        <section className="py-20 bg-gray-800/20 observe-animation opacity-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Integrates With Your Favorite Tools</h2>
              <p className="text-xl text-gray-400">Connect seamlessly with 20+ platforms</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[
                { name: "Gmail", category: "Email" },
                { name: "Outlook", category: "Email" },
                { name: "Salesforce", category: "CRM" },
                { name: "HubSpot", category: "CRM" },
                { name: "Zapier", category: "Automation" },
                { name: "Make", category: "Automation" },
                { name: "Slack", category: "Communication" },
                { name: "LinkedIn", category: "Social" },
                { name: "Calendly", category: "Scheduling" },
                { name: "Zoom", category: "Video" },
                { name: "Stripe", category: "Payments" },
                { name: "Google Drive", category: "Storage" }
              ].map((integration, index) => (
                <div
                  key={index}
                  className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 group cursor-pointer"
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📦</div>
                  <h3 className="font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{integration.name}</h3>
                  <p className="text-xs text-gray-500">{integration.category}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <button onClick={onGetStarted} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white font-bold rounded-xl hover:from-blue-500 hover:to-green-500 transition-all duration-300 hover:scale-105">
                See All Integrations →
              </button>
            </div>
          </div>
        </section>

        {/* Security & Compliance */}
        <section className="py-20 observe-animation opacity-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Enterprise-Grade Security</h2>
              <p className="text-xl text-gray-400">Your data is protected with industry-leading security</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                { icon: "🔒", title: "SOC 2 Type II", description: "Independently audited security controls" },
                { icon: "🛡️", title: "GDPR Compliant", description: "Full European data protection compliance" },
                { icon: "🔐", title: "256-bit Encryption", description: "Bank-level encryption for all data" },
                { icon: "🔑", title: "SSO & 2FA", description: "Enterprise authentication options" }
              ].map((item, index) => (
                <div key={index} className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 text-center">
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Security Features</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  "End-to-end encryption for all video content",
                  "Regular third-party security audits",
                  "99.9% uptime SLA with redundancy",
                  "Automatic data backups every 24 hours",
                  "Role-based access controls (RBAC)",
                  "Detailed audit logs and monitoring",
                  "DDoS protection and CDN security",
                  "Compliance with HIPAA, CCPA, SOX"
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 bg-gray-800/20 observe-animation opacity-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">How We Compare</h2>
              <p className="text-xl text-gray-400">See why professionals choose us</p>
            </div>

            <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-400">Feature</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-white bg-blue-600/20">
                        <div className="flex flex-col items-center">
                          <span className="text-lg">AI Video Assistant</span>
                          <span className="text-xs text-blue-400 mt-1">That's us!</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-gray-400">Competitor A</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-gray-400">Competitor B</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-gray-400">Manual Videos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: "AI Video Generation", us: true, compA: false, compB: true, manual: false },
                      { feature: "4-8 Second Creation", us: true, compA: false, compB: false, manual: false },
                      { feature: "Unlimited Videos", us: true, compA: false, compB: true, manual: true },
                      { feature: "Real-time Analytics", us: true, compA: true, compB: false, manual: false },
                      { feature: "Email Integration", us: true, compA: true, compB: true, manual: false },
                      { feature: "Multi-language Support", us: true, compA: false, compB: true, manual: false },
                      { feature: "Custom Branding", us: true, compA: true, compB: false, manual: true },
                      { feature: "API Access", us: true, compA: false, compB: false, manual: false },
                      { feature: "Starting Price", us: "Free", compA: "$99/mo", compB: "$79/mo", manual: "$0" }
                    ].map((row, index) => (
                      <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-300 font-semibold">{row.feature}</td>
                        <td className="px-6 py-4 text-center bg-blue-600/10">
                          {typeof row.us === 'boolean' ? (
                            row.us ? (
                              <svg className="w-6 h-6 text-green-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            )
                          ) : (
                            <span className="text-green-400 font-bold">{row.us}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {typeof row.compA === 'boolean' ? (
                            row.compA ? (
                              <svg className="w-6 h-6 text-green-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            )
                          ) : (
                            <span className="text-gray-400">{row.compA}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {typeof row.compB === 'boolean' ? (
                            row.compB ? (
                              <svg className="w-6 h-6 text-green-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            )
                          ) : (
                            <span className="text-gray-400">{row.compB}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {typeof row.manual === 'boolean' ? (
                            row.manual ? (
                              <svg className="w-6 h-6 text-green-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-red-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            )
                          ) : (
                            <span className="text-gray-400">{row.manual}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-12 text-center">
              <button onClick={onGetStarted} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white text-lg font-bold rounded-xl hover:from-blue-500 hover:to-green-500 transition-all duration-300 hover:scale-105">
                Try The Best Solution Free →
              </button>
            </div>
          </div>
        </section>

        {/* Resources Library */}
        <section className="py-20 observe-animation opacity-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Free Resources to Get You Started</h2>
              <p className="text-xl text-gray-400">Download templates, guides, and frameworks</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "50+ Video Script Templates", type: "Templates", downloads: "8.2K", format: "PDF" },
                { title: "Email Copywriting Masterclass", type: "Guide", downloads: "12.5K", format: "PDF" },
                { title: "ROI Calculator Spreadsheet", type: "Tool", downloads: "5.7K", format: "XLSX" },
                { title: "Prompt Engineering Guide", type: "E-book", downloads: "15.3K", format: "PDF" },
                { title: "Sales Psychology Framework", type: "Framework", downloads: "9.1K", format: "PDF" },
                { title: "Video Marketing Playbook", type: "Playbook", downloads: "11.8K", format: "PDF" }
              ].map((resource, index) => (
                <div key={index} className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">📄</div>
                    <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs font-bold rounded">{resource.format}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{resource.title}</h3>
                  <p className="text-sm text-gray-400 mb-4">{resource.type}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{resource.downloads} downloads</span>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-500 transition-colors">
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Expert Quotes */}
        <section className="py-20 bg-gray-800/20 observe-animation opacity-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">What Industry Experts Say</h2>
              <p className="text-xl text-gray-400">Insights from thought leaders and researchers</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  quote: "Video emails increase response rates by 300%. It's not optional anymore - it's essential for modern sales.",
                  author: "Dr. Sarah Johnson",
                  role: "Sales Psychology Researcher",
                  company: "Stanford Business School"
                },
                {
                  quote: "AI-powered personalization at scale is the biggest unlock for agencies in the past decade. The ROI is undeniable.",
                  author: "Michael Chen",
                  role: "Marketing Strategy Consultant",
                  company: "Forbes Council Member"
                },
                {
                  quote: "Executive candidates using video applications are 4X more likely to get interviews. It's a game-changer for career advancement.",
                  author: "Emma Rodriguez",
                  role: "Executive Recruiter",
                  company: "Fortune 500 Talent Advisor"
                },
                {
                  quote: "The data shows video outreach reduces sales cycles by 45%. Every sales team should be using this technology.",
                  author: "David Park",
                  role: "B2B Sales Analyst",
                  company: "Gartner Research"
                }
              ].map((expert, index) => (
                <div key={index} className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-8 hover:border-blue-500/50 transition-all duration-300">
                  <div className="text-5xl mb-4">💬</div>
                  <p className="text-lg text-gray-300 mb-6 italic">"{expert.quote}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center text-xl font-bold">
                      {expert.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white">{expert.author}</p>
                      <p className="text-sm text-gray-400">{expert.role}</p>
                      <p className="text-sm text-gray-500">{expert.company}</p>
                    </div>
                  </div>
                </div>
              ))}
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

const StatCard: React.FC<{ number: string | number; suffix: string; label: string; sublabel: string; color: 'blue' | 'green'; delay: number }> = ({ number, suffix, label, sublabel, color, delay }) => (
  <div
    className="text-center group cursor-default bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 animate-fadeInUp"
    style={{ animationDelay: `${delay}s` }}
  >
    <div className={`text-4xl md:text-5xl font-bold mb-2 transition-all duration-300 group-hover:scale-110 ${color === 'blue' ? 'text-blue-400' : 'text-green-400'}`}>
      {number}{suffix}
    </div>
    <div className="font-semibold text-white mb-1">{label}</div>
    <div className="text-sm text-gray-500">{sublabel}</div>
  </div>
);

const ProcessStep: React.FC<{ number: number; title: string; description: string; icon: string; color: 'blue' | 'green'; delay: number }> = ({ number, title, description, icon, color, delay }) => (
  <div className="text-center group animate-fadeInUp" style={{ animationDelay: `${delay}s` }}>
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

const FeatureCard: React.FC<{ icon: string; title: string; description: string; highlight?: string; delay: number }> = ({ icon, title, description, highlight, delay }) => (
  <div
    className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-blue-500 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 group animate-fadeInUp"
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="flex items-start justify-between mb-3">
      <span className="text-4xl transition-transform duration-500 group-hover:scale-125 group-hover:rotate-6">{icon}</span>
      {highlight && (
        <span className="text-xs px-2 py-1 bg-blue-600 rounded-full font-bold animate-pulse">{highlight}</span>
      )}
    </div>
    <h3 className="text-lg font-bold mb-2 transition-colors duration-300 group-hover:text-blue-400">{title}</h3>
    <p className="text-sm text-gray-400 transition-colors duration-300 group-hover:text-gray-300">{description}</p>
  </div>
);

const FAQItem: React.FC<{ question: string; answer: string; delay: number }> = ({ question, answer, delay }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 animate-fadeInUp"
      style={{ animationDelay: `${delay}s` }}
    >
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

const UseCaseCard: React.FC<{ icon: string; title: string; description: string; features: string[] }> = ({ icon, title, description, features }) => (
  <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-500 hover:scale-105 hover:shadow-xl">
    <span className="text-4xl block mb-4">{icon}</span>
    <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
    <p className="text-gray-400 mb-4">{description}</p>
    <ul className="space-y-2">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
          <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {feature}
        </li>
      ))}
    </ul>
  </div>
);
