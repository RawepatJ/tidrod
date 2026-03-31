'use client';

import Link from 'next/link';
import { MapPin, Users, MessageSquare, Globe, Star, ChevronRight, Shield, Sparkles, Map, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

function AnimatedCounter({ end, label, duration = 2000 }: { end: number; label: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    const el = document.getElementById(`counter-${label}`);
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [label]);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, end, duration]);

  return (
    <div id={`counter-${label}`} className="text-center">
      <div className="text-4xl lg:text-5xl font-black text-[#FF9B51]">{count}+</div>
      <div className="text-sm text-[#25343F]/60 font-medium mt-1">{label}</div>
    </div>
  );
}

const FEATURES = [
  {
    icon: MapPin,
    title: 'Pin Your Trip',
    description: 'Mark your travel destination on the map and let others discover it.',
    gradient: 'from-orange-400 to-pink-500',
  },
  {
    icon: Users,
    title: 'Find Travel Buddies',
    description: 'Connect with fellow travelers heading the same way.',
    gradient: 'from-blue-400 to-indigo-500',
  },
  {
    icon: MessageSquare,
    title: 'Real-time Chat',
    description: 'Discuss plans, share tips, and coordinate with your group.',
    gradient: 'from-green-400 to-emerald-500',
  },
  {
    icon: Shield,
    title: 'Safe Community',
    description: 'Ladies-only trips, private groups, and moderated content.',
    gradient: 'from-purple-400 to-violet-500',
  },
  {
    icon: Star,
    title: 'Rate & Review',
    description: 'Share your experience and help others choose the best trips.',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    icon: Globe,
    title: 'Explore Thailand',
    description: 'Discover amazing destinations all across the Land of Smiles.',
    gradient: 'from-teal-400 to-cyan-500',
  },
];

const STEPS = [
  { step: '01', title: 'Create a Trip', description: 'Pick your destination, set the date, and pin it on the map.' },
  { step: '02', title: 'Get Travelers', description: 'Others discover your trip and request to join.' },
  { step: '03', title: 'Chat & Plan', description: 'Discuss details in real-time chat with your group.' },
  { step: '04', title: 'Travel Together', description: 'Meet up, explore, and rate the experience!' },
];

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="flex-1 overflow-y-auto bg-[#EAEFEF]">

      {/* ─── HERO ─── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#25343F] via-[#1a2730] to-[#25343F]" />
        
        {/* Animated grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #FF9B51 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            transform: `translateY(${scrollY * 0.1}px)`,
          }}
        />

        {/* Floating blobs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#FF9B51]/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FF9B51]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/10 mb-8 animate-fade-in">
            <Sparkles size={14} className="text-[#FF9B51]" />
            <span className="text-white/80 text-sm font-medium">Thailand&apos;s Travel Community</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Travel Together,{' '}
            <span className="bg-gradient-to-r from-[#FF9B51] via-[#FFB87A] to-[#FF9B51] bg-clip-text text-transparent">
              Explore More
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Pin your trips on the map, find travel buddies, and explore Thailand together. 
            Real-time chat, private groups, and a safe community for every traveler.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link
              href="/home"
              className="group px-8 py-4 bg-gradient-to-r from-[#FF9B51] to-[#e8893f] text-white rounded-2xl font-bold text-lg shadow-2xl shadow-[#FF9B51]/30 hover:shadow-[#FF9B51]/50 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <Map size={20} />
              Explore the Map
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/register"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-bold text-lg border border-white/20 hover:bg-white/20 transition-all hover:-translate-y-1"
            >
              Join Free
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
              <div className="w-1.5 h-3 bg-[#FF9B51] rounded-full mt-2 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="relative -mt-12 z-10 max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-3xl shadow-2xl border border-[#BFC9D1]/20 p-8 grid grid-cols-3 gap-8">
          <AnimatedCounter end={500} label="Trips Created" />
          <AnimatedCounter end={1200} label="Travelers" />
          <AnimatedCounter end={300} label="Locations" />
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-[#FF9B51]/10 text-[#FF9B51] rounded-full text-sm font-bold mb-4">
            Features
          </span>
          <h2 className="text-4xl lg:text-5xl font-black text-[#25343F] mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-[#25343F]/60 max-w-xl mx-auto">
            Built for travelers who want to explore together safely and easily.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group bg-white rounded-2xl p-6 shadow-sm border border-[#BFC9D1]/20 hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <feature.icon size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#25343F] mb-2">{feature.title}</h3>
              <p className="text-sm text-[#25343F]/60 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-[#25343F] py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#FF9B51]/20 text-[#FF9B51] rounded-full text-sm font-bold mb-4">
              How It Works
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
              4 Simple Steps
            </h2>
            <p className="text-lg text-white/50 max-w-xl mx-auto">
              From planning to traveling — it&apos;s that easy.
            </p>
          </div>

          <div className="space-y-0">
            {STEPS.map((step, i) => (
              <div key={step.step} className="relative flex gap-6 items-start">
                {/* Line */}
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF9B51] to-[#e8893f] flex items-center justify-center text-white font-black text-lg shadow-xl shadow-[#FF9B51]/20 z-10">
                    {step.step}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-0.5 h-16 bg-gradient-to-b from-[#FF9B51]/40 to-transparent" />
                  )}
                </div>

                <div className="pb-12">
                  <h3 className="text-xl font-bold text-white mb-1">{step.title}</h3>
                  <p className="text-white/50 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#EAEFEF] to-white" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FF9B51]/10 rounded-full blur-[120px]" />
        
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-black text-[#25343F] mb-6">
            Ready to{' '}
            <span className="bg-gradient-to-r from-[#FF9B51] to-[#e8893f] bg-clip-text text-transparent">
              Explore?
            </span>
          </h2>
          <p className="text-lg text-[#25343F]/60 mb-10 max-w-xl mx-auto">
            Join thousands of travelers discovering Thailand together. It&apos;s free, fun, and safe.
          </p>
          <Link
            href="/home"
            className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-[#FF9B51] to-[#e8893f] text-white rounded-2xl font-bold text-lg shadow-2xl shadow-[#FF9B51]/30 hover:shadow-[#FF9B51]/50 transition-all hover:-translate-y-1"
          >
            <Map size={22} />
            Open the Map
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#25343F] py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-white font-bold text-lg">
            <span className="text-[#FF9B51]">Tid</span>Rod
          </div>
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} TidRod. Travel Together, Explore More.
          </p>
          <div className="flex gap-4 text-white/40">
            <Link href="/home" className="hover:text-[#FF9B51] transition-colors text-sm">Map</Link>
            <Link href="/login" className="hover:text-[#FF9B51] transition-colors text-sm">Sign In</Link>
            <Link href="/register" className="hover:text-[#FF9B51] transition-colors text-sm">Register</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
