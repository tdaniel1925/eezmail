import Link from 'next/link';
import { Sparkles, Zap, Calendar, MapPin, ArrowRight, Check, Users, Target, Rocket } from 'lucide-react';
import { VideoBackground } from '@/components/landing/VideoBackground';
import { AnimatedCard } from '@/components/landing/AnimatedCard';
import { MarqueeText } from '@/components/landing/MarqueeText';
import { TicketCard } from '@/components/landing/TicketCard';
import { Accordion } from '@/components/landing/Accordion';
import Image from 'next/image';

export const metadata = {
  title: 'easeMail - AI-Powered Email for Enterprises | Save 10 Hours Per Week',
  description:
    'Transform your email workflow with AI-powered intelligence. The future of email productivity starts here.',
};

export default function LandingPage() {
  const faqItems = [
    {
      id: '1',
      title: 'What is easeMail?',
      content: 'easeMail is an AI-powered email client designed for professionals and teams. It combines intelligent automation, semantic search, and productivity features to help you process email 10x faster.',
    },
    {
      id: '2',
      title: 'How does AI email processing work?',
      content: 'Our AI automatically categorizes, prioritizes, and summarizes your emails using advanced machine learning. It learns from your behavior to provide increasingly accurate suggestions and automations.',
    },
    {
      id: '3',
      title: 'Is my data secure?',
      content: 'Absolutely. We use enterprise-grade encryption, comply with SOC 2 Type II and GDPR standards, and never sell your data. Your email content is processed securely and never shared with third parties.',
    },
    {
      id: '4',
      title: 'What email providers do you support?',
      content: 'easeMail works with Gmail, Outlook, Office 365, and any IMAP-compatible email provider. We support multiple accounts and unified inbox views.',
    },
    {
      id: '5',
      title: 'Can I cancel anytime?',
      content: 'Yes! There are no long-term contracts. You can upgrade, downgrade, or cancel your subscription at any time. Your data remains accessible during your billing period.',
    },
    {
      id: '6',
      title: 'Do you offer a free trial?',
      content: 'Yes! We offer a 14-day free trial with full access to all Professional features. No credit card required to start.',
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <VideoBackground
        videoSrc="/landing/video/2.mp4"
        className="min-h-screen section-dark text-light relative"
        overlayOpacity={0.8}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E40AF]/10 to-transparent opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
        
        <div className="relative z-20 min-h-screen flex items-center justify-center">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-5xl mx-auto">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-white/80 bg-white/5 ring-white/10 ring-1 rounded-full mb-8 pt-1.5 pr-3 pb-1.5 pl-3 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                The Future of Intelligence
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6">
                AI Email Summit 2025
              </h1>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8 text-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-[#1E40AF]" />
                  <span className="text-white font-semibold">October 1–5, 2025</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-[#1E40AF]" />
                  <span className="text-white font-semibold">San Francisco, CA</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] text-white font-semibold rounded-full hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                >
                  <span>Get Tickets</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="#section-schedule"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-full ring-1 ring-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300"
                >
                  <span>View Schedule</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Card */}
        <div className="absolute bottom-0 left-0 right-0 z-30 pb-8 hidden md:block">
          <div className="container mx-auto px-6">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Hurry Up!</h2>
                <p className="text-white/70">Book Your Seat Now</p>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-12 w-12 text-[#1E40AF]" />
                <div>
                  <p className="text-white font-semibold">121 AI Blvd</p>
                  <p className="text-white/70 text-sm">San Francisco BCA 94107</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </VideoBackground>

      {/* About Section */}
      <section id="section-about" className="bg-slate-950 section-dark text-light py-20 md:py-32">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-[#1E40AF] text-sm font-semibold uppercase tracking-wider mb-4">
                About the Event
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                A Global Gathering of AI Innovators
              </h2>
              <p className="text-white/70 text-lg mb-8">
                Join thought leaders, developers, researchers, and founders as we explore how artificial intelligence 
                is reshaping industries, creativity, and the future of work.
              </p>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-[#1E40AF] flex-shrink-0 mt-1" />
                  <span className="text-white/80">5 days of keynotes, workshops, and networking</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-[#1E40AF] flex-shrink-0 mt-1" />
                  <span className="text-white/80">50 world-class speakers</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-[#1E40AF] flex-shrink-0 mt-1" />
                  <span className="text-white/80">Startup showcase and live demos</span>
                </li>
              </ul>
            </div>

            <div className="relative">
              <div className="relative w-full aspect-square">
                <Image
                  src="/landing/images/misc/c1.webp"
                  alt="AI Innovation"
                  fill
                  className="object-cover rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Section */}
      <section className="bg-slate-950 py-8">
        <div className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] py-6 transform rotate-2">
          <MarqueeText
            items={[
              'Next Intelligence',
              'Future Now',
              'Empowering Innovation',
              'Smarter Tomorrow',
              'Think Forward',
              'Cognitive Shift',
            ]}
            className="text-white text-4xl md:text-6xl font-bold"
          />
        </div>
        <div className="bg-gradient-to-r from-[#3B82F6] to-[#1E40AF] py-6 transform -rotate-1 -mt-8">
          <MarqueeText
            items={[
              'Next Intelligence',
              'Future Now',
              'Empowering Innovation',
              'Smarter Tomorrow',
              'Think Forward',
              'Cognitive Shift',
            ]}
            direction="right"
            className="text-white text-4xl md:text-6xl font-bold"
          />
        </div>
      </section>

      {/* Why Attend Section */}
      <section id="section-why-attend" className="bg-slate-950 section-dark text-light py-20 md:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-[#1E40AF] text-sm font-semibold uppercase tracking-wider mb-4">
              Why Attend
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              What You'll Gain
            </h2>
            <p className="text-white/70 text-lg">
              Hear from global AI pioneers, industry disruptors, and bold thinkers shaping the future across every domain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatedCard
              title="Cutting-Edge Knowledge"
              description="Stay ahead of the curve with insights from AI leaders shaping tomorrow's technology."
              imageSrc="/landing/images/misc/s3.webp"
              className="h-80"
            />
            <AnimatedCard
              title="Hands-On Learning"
              description="Join live workshops and labs to build practical skills in AI and machine learning."
              imageSrc="/landing/images/misc/s4.webp"
              className="h-80"
            />
            <AnimatedCard
              title="Global Networking"
              description="Meet developers, founders, and researchers from around the world to collaborate and grow."
              imageSrc="/landing/images/misc/s5.webp"
              className="h-80"
            />
            <AnimatedCard
              title="Startup Showcase"
              description="Explore the latest AI tools and ideas from promising startups and research labs."
              imageSrc="/landing/images/misc/s6.webp"
              className="h-80"
            />
            <AnimatedCard
              title="AI Career Boost"
              description="Access exclusive job fairs, mentorship sessions, and recruiting events to grow your career."
              imageSrc="/landing/images/misc/s7.webp"
              className="h-80"
            />
            <AnimatedCard
              title="Ethics & Future"
              description="Engage in vital conversations around AI ethics, policy, and the future of intelligence."
              imageSrc="/landing/images/misc/s8.webp"
              className="h-80"
            />
          </div>
        </div>
      </section>

      {/* Speakers Section */}
      <section id="section-speakers" className="bg-slate-950 section-dark text-light py-20 md:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-[#1E40AF] text-sm font-semibold uppercase tracking-wider mb-4">
              Speakers
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Meet the Visionaries
            </h2>
            <p className="text-white/70 text-lg">
              Learn from the best minds in artificial intelligence, machine learning, and innovation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group relative rounded-2xl overflow-hidden">
              <div className="relative h-96">
                <Image
                  src="/landing/images/team/1.webp"
                  alt="Speaker"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#1E40AF]/0 to-[#1E40AF]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl p-4 text-center">
                  <h3 className="text-xl font-bold text-white mb-1">Joshua Henry</h3>
                  <p className="text-white/70 text-sm">Chief AI Scientist, OpenAI</p>
                </div>
              </div>
            </div>

            <div className="group relative rounded-2xl overflow-hidden">
              <div className="relative h-96">
                <Image
                  src="/landing/images/team/2.webp"
                  alt="Speaker"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#1E40AF]/0 to-[#1E40AF]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl p-4 text-center">
                  <h3 className="text-xl font-bold text-white mb-1">Leila Zhang</h3>
                  <p className="text-white/70 text-sm">VP of Machine Learning, Google</p>
                </div>
              </div>
            </div>

            <div className="group relative rounded-2xl overflow-hidden">
              <div className="relative h-96">
                <Image
                  src="/landing/images/team/3.webp"
                  alt="Speaker"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#1E40AF]/0 to-[#1E40AF]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl p-4 text-center">
                  <h3 className="text-xl font-bold text-white mb-1">Carlos Rivera</h3>
                  <p className="text-white/70 text-sm">Founder & CEO, NeuralCore</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="section-tickets" className="bg-slate-950 section-dark text-light py-20 md:py-32 relative">
        <div className="absolute inset-0 opacity-5">
          <Image
            src="/landing/images/background/7.webp"
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950" />

        <div className="relative z-10 container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-[#1E40AF] text-sm font-semibold uppercase tracking-wider mb-4">
              Ticket Options
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Choose Your Pass
            </h2>
            <p className="text-white/70 text-lg">
              Select the perfect ticket for your needs and gain access to exclusive sessions, workshops, and more.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <TicketCard
              title="Standard"
              price="$299"
              features={[
                'Access to keynotes and sessions',
                'Admission to exhibitions and demos',
                'Networking opportunities',
                'Digital materials and session recordings',
              ]}
              href="/signup"
            />
            <TicketCard
              title="VIP"
              price="$699"
              popular
              features={[
                'All Standard benefits',
                'VIP lounge access and exclusive events',
                'Front-row seating and priority workshop access',
                'VIP swag bag and exclusive content',
              ]}
              href="/signup"
            />
            <TicketCard
              title="Full Access"
              price="$1199"
              features={[
                'All VIP benefits',
                'Access to all workshops and breakout sessions',
                'Personalized session scheduling',
                'Speaker meet-and-greet and after-party access',
              ]}
              href="/signup"
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="section-faq" className="bg-slate-950 section-dark text-light py-20 md:py-32">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="text-[#1E40AF] text-sm font-semibold uppercase tracking-wider mb-4">
                Everything You Need to Know
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Frequently Asked Questions
              </h2>
            </div>

            <div>
              <Accordion items={faqItems} />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-950 section-dark text-light py-20 md:py-32 relative">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="/landing/images/background/3.webp"
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950" />

        <div className="relative z-10 container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="text-[#1E40AF] text-sm font-semibold uppercase tracking-wider mb-4">
              Stay in the Loop
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Join the Future of Innovation
            </h2>
            <p className="text-white/70 text-lg mb-8">
              Drop us your email to stay in the know as we work to reduce our environmental impact. 
              We'll share other exciting news and exclusive offers, too.
            </p>

            <form className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto">
              <input
                type="email"
                placeholder="Enter Your Email Address"
                className="w-full px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#1E40AF] backdrop-blur-sm"
              />
              <button
                type="submit"
                className="whitespace-nowrap px-8 py-4 bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] text-white font-semibold rounded-full hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
              >
                SIGN UP
              </button>
            </form>

            <div className="mt-6 text-sm text-white/50">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" defaultChecked />
                <span>Keep me updated on other news and exclusive offers</span>
              </label>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
