import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Target, Users, Zap } from 'lucide-react';

export const metadata = {
  title: 'About Us - easeMail | Meet the Team Behind the AI Email Revolution',
  description:
    "Learn about easeMail's mission to transform email with AI. Meet our founders: Trent T. Daniel and Sella Hall.",
};

export default function AboutPage() {
  const founders = [
    {
      name: 'Trent T. Daniel',
      title: 'Founder of BotMakers, Inc.',
      image: '/images/trent-daniel.png',
      bio: 'Trent is a visionary entrepreneur with a passion for AI and automation. As the founder of BotMakers, Inc., he has led the development of cutting-edge AI solutions that transform how businesses operate. With easeMail, Trent is bringing enterprise-grade AI to email management.',
    },
    {
      name: 'Sella Hall',
      title: 'Chief Experience Officer',
      image: '/images/sella-hall.png',
      bio: "Sella is a UX expert and product strategist with over a decade of experience designing intuitive software for Fortune 500 companies. She ensures that easeMail's powerful AI features are accessible and delightful to use, making productivity effortless.",
    },
  ];

  const values = [
    {
      icon: Sparkles,
      title: 'AI-First Innovation',
      description:
        'We believe AI should augment human capability, not replace it. Every feature we build makes you smarter and faster.',
    },
    {
      icon: Target,
      title: 'User-Centric Design',
      description:
        "Powerful doesn't mean complicated. We obsess over making complex AI features simple and intuitive.",
    },
    {
      icon: Users,
      title: 'Privacy & Trust',
      description:
        'Your data is yours. We never train on your emails, never sell your data, and put security first—always.',
    },
    {
      icon: Zap,
      title: 'Relentless Execution',
      description:
        'We move fast and ship quality. Our team is committed to delivering the best email experience, period.',
    },
  ];

  const milestones = [
    { year: '2023', event: 'BotMakers, Inc. founded by Trent T. Daniel' },
    {
      year: '2024',
      event:
        'easeMail concept born from frustration with existing email clients',
    },
    { year: 'Q1 2025', event: 'Beta launch with 500+ early adopters' },
    { year: 'Q2 2025', event: 'Public launch and Series A funding' },
    {
      year: 'Future',
      event: 'AI-powered email for 1M+ professionals worldwide',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FF4C5A]/10 to-transparent"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-white/80 ring-1 ring-white/10 mb-6">
              <Sparkles className="w-4 h-4" />
              Meet the Team
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-white">
              We're Building the{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF4C5A] to-white">
                Future of Email
              </span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              easeMail was born from a simple frustration: email clients haven't
              evolved for decades. We're changing that with AI-first design and
              relentless focus on productivity.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <div className="rounded-3xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center text-white">
              Our Mission
            </h2>
            <p className="text-xl text-slate-300 leading-relaxed text-center mb-8">
              To save professionals{' '}
              <span className="text-white font-semibold">
                10+ hours per week
              </span>{' '}
              by making email management intelligent, fast, and delightful. We
              believe AI should handle the busywork so you can focus on what
              matters—building relationships and making decisions.
            </p>
            <div className="flex justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF4C5A] text-white px-8 py-4 text-lg font-medium hover:bg-[#FF4C5A]/90 transition"
              >
                Join Our Mission
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Founders */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Meet Our Founders
            </h2>
            <p className="text-slate-400">The visionaries behind easeMail</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {founders.map((founder, index) => (
              <div
                key={index}
                className="rounded-3xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md overflow-hidden hover:ring-white/20 transition"
              >
                <div className="aspect-square relative bg-slate-800">
                  <Image
                    src={founder.image}
                    alt={founder.name}
                    fill
                    className="object-cover"
                    style={
                      founder.name === 'Sella Hall'
                        ? { objectPosition: '50% 30%' }
                        : undefined
                    }
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-1 text-white">{founder.name}</h3>
                  <p className="text-[#FF4C5A] font-medium mb-4">
                    {founder.title}
                  </p>
                  <p className="text-slate-300 leading-relaxed">
                    {founder.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Our Values</h2>
            <p className="text-slate-400">What drives us every day</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-6 text-center hover:ring-white/20 transition"
              >
                <div className="w-12 h-12 rounded-full bg-[#FF4C5A]/10 ring-1 ring-[#FF4C5A]/20 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-6 h-6 text-[#FF4C5A]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-slate-400">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Our Journey</h2>
            <p className="text-slate-400">
              From idea to AI-powered email revolution
            </p>
          </div>
          <div className="space-y-6">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className="flex gap-6 items-start rounded-2xl bg-slate-900/40 ring-1 ring-white/10 backdrop-blur-md p-6 hover:ring-white/20 transition"
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-[#FF4C5A]/10 ring-1 ring-[#FF4C5A]/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#FF4C5A]">
                      {milestone.year}
                    </span>
                  </div>
                </div>
                <div className="flex-1 pt-3">
                  <p className="text-lg text-slate-200">{milestone.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 md:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-[#FF4C5A]/20 to-transparent ring-1 ring-[#FF4C5A]/30 p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Join Us on This Journey
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Be part of the email revolution. Start using easeMail today.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-slate-900 px-8 py-4 text-lg font-semibold hover:bg-slate-100 transition"
            >
              Start Free Trial
            </Link>
            <p className="text-sm text-slate-400 mt-4">
              14-day free trial • No credit card required
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
