'use client';

import Link from 'next/link';
import { MapPin, Users, MessageSquare, Globe, Star, ChevronRight, Shield, Sparkles, Map, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSession } from '../components/SessionProvider';



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
  const { user } = useSession();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="flex-1 overflow-y-auto bg-[#EAEFEF] font-main">

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

        {/* Content */}
        <div className="mb-20 relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/10 mb-8 animate-fade-in">
            <Sparkles size={14} className="text-[#FF9B51]" />
            <span className="text-white/80 text-sm font-medium">คอมมูนิตี้คนรักการเดินทางในไทย</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            ไปด้วยกัน {' '}
            <span className="bg-gradient-to-r from-[#FF9B51] via-[#FFB87A] to-[#FF9B51] bg-clip-text text-transparent">
              ไปได้ไกล
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            ปักหมุดทริปของคุณบนแผนที่ หาเพื่อนร่วมทาง และเดินทางไปด้วยกัน
            แชทสด และชุมชนที่ปลอดภัยสำหรับนักเดินทางทุกคน
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link
              href="/home"
              className="group px-8 py-4 bg-gradient-to-r from-[#FF9B51] to-[#e8893f] text-white rounded-2xl font-bold text-lg shadow-2xl shadow-[#FF9B51]/30 hover:shadow-[#FF9B51]/50 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <Map size={20} />
              สำรวจแผนที่
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            {!user && (
              <Link
                href="/register"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-bold text-lg border border-white/20 hover:bg-white/20 transition-all hover:-translate-y-1"
              >
                สมัครสมาชิกฟรี
              </Link>
            )}
          </div>

        </div>
      </section>

      {/* ─── THAI HIGHLIGHTS MARQUEE ─── */}
      <section className="relative -mt-12 z-10 w-full overflow-hidden">
        <div className="bg-white/80 backdrop-blur-md border-y border-[#BFC9D1]/20 py-6 shadow-xl">
          <div className="flex whitespace-nowrap animate-marquee hover:pause group">
            {[
              "🏰 พระบรมมหาราชวัง กรุงเทพฯ", "🐘 เดินป่า เชียงใหม่", "🏖️ ทัวร์เกาะ ภูเก็ต",
              "⛩️ วัดเก่า อยุธยา", "🛶 ปีนเขาที่กระบี่", "🌅 ชมวิวเกาะสมุย",
              "🍜 ตลาดโต้รุ่ง กรุงเทพฯ", "🥊 ฝึกมวยไทย", "🍲 คอร์สทำอาหารไทย",
              "🎋 ป่าฝน เขาสก", "🌊 ดำน้ำ สิมิลัน", "🎆 เทศกาลลอยกระทง",
              "💦 เทศกาลสงกรานต์"
            ].map((item, i) => (
              <div key={i} className="flex items-center mx-8">
                <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-[#25343F] to-[#25343F]/60 bg-clip-text text-transparent group-hover:from-[#FF9B51] group-hover:to-[#e8893f] transition-all duration-300">
                  {item}
                </span>
                <div className="ml-8 w-2 h-2 rounded-full bg-[#FF9B51]/30" />
              </div>
            ))}
            {/* Duplicate for seamless loop */}
            {[
              "🏰 พระบรมมหาราชวัง กรุงเทพฯ", "🐘 เดินป่า เชียงใหม่", "🏖️ ทัวร์เกาะ ภูเก็ต",
              "⛩️ วัดเก่า อยุธยา", "🛶 ปีนเขาที่กระบี่", "🌅 ชมวิวเกาะสมุย",
              "🍜 ตลาดโต้รุ่ง กรุงเทพฯ", "🥊 ฝึกมวยไทย", "🍲 คอร์สทำอาหารไทย",
              "🎋 ป่าฝน เขาสก", "🌊 ดำน้ำ สิมิลัน", "🎆 เทศกาลลอยกระทง",
              "💦 เทศกาลสงกรานต์"
            ].map((item, i) => (
              <div key={`dup-${i}`} className="flex items-center mx-8">
                <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-[#25343F] to-[#25343F]/60 bg-clip-text text-transparent group-hover:from-[#FF9B51] group-hover:to-[#e8893f] transition-all duration-300">
                  {item}
                </span>
                <div className="ml-8 w-2 h-2 rounded-full bg-[#FF9B51]/30" />
              </div>
            ))}
          </div>
        </div>

        <style jsx global>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            display: flex;
            width: fit-content;
            animation: marquee 40s linear infinite;
          }
          .pause {
            animation-play-state: paused;
          }
        `}</style>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-[#FF9B51]/10 text-[#FF9B51] rounded-full text-sm font-bold mb-4">
            ฟีเจอร์เด่น
          </span>
          <h2 className="text-4xl lg:text-5xl font-black text-[#25343F] mb-4">
            ทุกสิ่งที่คุณต้องการ
          </h2>
          <p className="text-lg text-[#25343F]/60 max-w-xl mx-auto">
            สร้างมาเพื่อนักเดินทางที่ต้องการสำรวจไปด้วยกันอย่างปลอดภัยและง่ายดาย
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: MapPin,
              title: 'ปักหมุดทริปของคุณ',
              description: 'ระบุจุดหมายปลายทางบนแผนที่และให้คนอื่นค้นพบความตั้งใจของคุณ',
              gradient: 'from-orange-400 to-pink-500',
            },
            {
              icon: Users,
              title: 'หาเพื่อนเที่ยว',
              description: 'เชื่อมต่อกับนักเดินทางที่มีจุดหมายเดียวกันและชอบสไตล์เดียวกัน',
              gradient: 'from-blue-400 to-indigo-500',
            },
            {
              icon: MessageSquare,
              title: 'แชทแบบเรียลไทม์',
              description: 'วางแผนทริป แบ่งปันเคล็ดลับ และประสานงานกับกลุ่มของคุณได้ทันที',
              gradient: 'from-green-400 to-emerald-500',
            },
            {
              icon: Shield,
              title: 'ชุมชนที่ปลอดภัย',
              description: 'ทริปสำหรับผู้หญิงโดยเฉพาะ กลุ่มส่วนตัว และการดูแลเนื้อหาที่เข้มงวด',
              gradient: 'from-purple-400 to-violet-500',
            },
            {
              icon: Star,
              title: 'ให้คะแนนและรีวิว',
              description: 'แบ่งปันประสบการณ์และช่วยให้คนอื่นเลือกทริปและเพื่อนร่วมทางที่ดีที่สุด',
              gradient: 'from-amber-400 to-orange-500',
            },
            {
              icon: Globe,
              title: 'สำรวจเมืองไทย',
              description: 'ค้นพบจุดหมายปลายทางที่น่าทึ่งทั่วสยามเมืองยิ้มที่คุณอาจไม่เคยเห็น',
              gradient: 'from-teal-400 to-cyan-500',
            },
          ].map((feature) => (
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
              ขั้นตอนการใช้งาน
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">
              4 ขั้นตอนง่ายๆ
            </h2>
            <p className="text-lg text-white/50 max-w-xl mx-auto">
              ตั้งแต่การวางแผนไปจนถึงการออกเดินทาง มั่นใจได้ในทุกก้าว
            </p>
          </div>

          <div className="space-y-0">
            {[
              { step: '01', title: 'สร้างทริป', description: 'เลือกจุดหมายปลายทาง กำหนดวันที่ และปักหมุดลงบนแผนที่' },
              { step: '02', title: 'รอผู้ร่วมทาง', description: 'ให้นักเดินทางท่านอื่นค้นพบทริปของคุณและส่งคำขอเข้าร่วม' },
              { step: '03', title: 'แชทและวางแผน', description: 'พูดคุยรายละเอียดและเตรียมความพร้อมผ่านระบบแชทกลุ่ม' },
              { step: '04', title: 'เริ่มการเดินทาง!', description: 'นัดพบ ออกสำรวจ และให้คะแนนประสบการณ์ร่วมกัน' },
            ].map((step, i, arr) => (
              <div key={step.step} className="relative flex gap-6 items-start">
                {/* Line */}
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF9B51] to-[#e8893f] flex items-center justify-center text-white font-black text-lg shadow-xl shadow-[#FF9B51]/20 z-10">
                    {step.step}
                  </div>
                  {i < arr.length - 1 && (
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
            พร้อมที่จะ{' '}
            <span className="bg-gradient-to-r from-[#FF9B51] to-[#e8893f] bg-clip-text text-transparent">
              ออกเดินทางหรือยัง?
            </span>
          </h2>
          <p className="text-lg text-[#25343F]/60 mb-10 max-w-xl mx-auto">
            เข้าร่วมกับนักเดินทางนับพันที่ค้นพบเมืองไทยไปด้วยกัน ฟรี สนุก และปลอดภัย
          </p>
          <Link
            href="/home"
            className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-[#FF9B51] to-[#e8893f] text-white rounded-2xl font-bold text-lg shadow-2xl shadow-[#FF9B51]/30 hover:shadow-[#FF9B51]/50 transition-all hover:-translate-y-1"
          >
            <Map size={22} />
            เปิดแผนที่เลย
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
            © {new Date().getFullYear()} TidRod. เดินทางด้วยกัน, เที่ยวให้สุด.
          </p>
          <div className="flex gap-4 text-white/40">
            <Link href="/home" className="hover:text-[#FF9B51] transition-colors text-sm">แผนที่</Link>
            <Link href="/login" className="hover:text-[#FF9B51] transition-colors text-sm">เข้าสู่ระบบ</Link>
            <Link href="/register" className="hover:text-[#FF9B51] transition-colors text-sm">สมัครสมาชิก</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
