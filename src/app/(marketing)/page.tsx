import Link from 'next/link';
import { Sparkles, Zap, Calendar, MapPin, ArrowRight, Check, Users, Target, Rocket } from 'lucide-react';
import { VideoBackground } from '@/components/landing/VideoBackground';
import { AnimatedCard } from '@/components/landing/AnimatedCard';
import { MarqueeText } from '@/components/landing/MarqueeText';
import { TicketCard } from '@/components/landing/TicketCard';
import { Accordion } from '@/components/landing/Accordion';
import { AnimatedSection } from '@/components/landing/AnimatedSection';
import { ParallaxSection } from '@/components/landing/ParallaxSection';
import { MarketingInteractions } from '@/components/marketing/MarketingInteractions';
import { AnimatedCounter } from '@/components/marketing/AnimatedCounter';
import { NewsletterSignup } from '@/components/marketing/NewsletterSignup';
import { TestimonialsSection } from '@/components/marketing/TestimonialsSection';
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
      <MarketingInteractions />
      
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
                Next-Gen Email Intelligence
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6">
                Transform Your Email Workflow
              </h1>

              <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto">
                AI-powered email client that saves 10+ hours per week. Built for professionals who demand speed, intelligence, and privacy.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] text-white font-semibold rounded-full hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="#section-features"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-full ring-1 ring-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300"
                >
                  <span>Explore Features</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Card */}
        <div className="absolute bottom-0 left-0 right-0 z-30 pb-8 hidden md:block">
          <div className="container mx-auto px-6">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  <AnimatedCounter end={10} suffix="+" />
                </div>
                <p className="text-white/70 text-sm">Hours Saved Per Week</p>
              </div>
              <div className="text-center border-x border-white/10">
                <div className="text-3xl font-bold text-white mb-1">
                  <AnimatedCounter end={99.9} decimals={1} suffix="%" />
                </div>
                <p className="text-white/70 text-sm">Uptime SLA</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  <AnimatedCounter end={120} suffix="ms" />
                </div>
                <p className="text-white/70 text-sm">Average Response Time</p>
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
                About easeMail
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                Email Productivity, Reimagined
              </h2>
              <p className="text-white/70 text-lg mb-8">
                easeMail combines cutting-edge AI with intuitive design to transform how professionals manage email. 
                Process messages 10x faster, never miss important communications, and reclaim your time.
              </p>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-[#1E40AF] flex-shrink-0 mt-1" />
                  <span className="text-white/80">AI-powered inbox triage and smart categorization</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-[#1E40AF] flex-shrink-0 mt-1" />
                  <span className="text-white/80">Semantic search across your entire email history</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-[#1E40AF] flex-shrink-0 mt-1" />
                  <span className="text-white/80">Enterprise-grade security and compliance</span>
                </li>
              </ul>
            </div>

            <div className="relative">
              <div className="relative w-full aspect-square">
                <Image
                  src="/landing/images/misc/c1.webp"
                  alt="easeMail Platform"
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
              'Smart Inbox',
              'AI Assistant',
              'Instant Search',
              'Privacy First',
              '10x Faster',
              'Enterprise Ready',
            ]}
            className="text-white text-4xl md:text-6xl font-bold"
          />
        </div>
        <div className="bg-gradient-to-r from-[#3B82F6] to-[#1E40AF] py-6 transform -rotate-1 -mt-8">
          <MarqueeText
            items={[
              'Smart Inbox',
              'AI Assistant',
              'Instant Search',
              'Privacy First',
              '10x Faster',
              'Enterprise Ready',
            ]}
            direction="right"
            className="text-white text-4xl md:text-6xl font-bold"
          />
        </div>
      </section>

      {/* Why Attend Section */}
      <section id="section-features" className="bg-slate-950 section-dark text-light py-20 md:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-[#1E40AF] text-sm font-semibold uppercase tracking-wider mb-4">
              Why easeMail
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Built for Productivity
            </h2>
            <p className="text-white/70 text-lg">
              Experience email management that adapts to your workflow, learns from your behavior, and helps you focus on what matters most.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatedCard
              title="AI-Powered Triage"
              description="Automatically categorize, prioritize, and surface your most important emails. Never miss what matters."
              imageSrc="/landing/images/misc/s3.webp"
              className="h-80"
            />
            <AnimatedCard
              title="Semantic Search"
              description="Find any email instantly with natural language search. No more endless scrolling or complex filters."
              imageSrc="/landing/images/misc/s4.webp"
              className="h-80"
            />
            <AnimatedCard
              title="Smart Compose"
              description="Write emails faster with AI suggestions, templates, and tone adjustment. Save hours every week."
              imageSrc="/landing/images/misc/s5.webp"
              className="h-80"
            />
            <AnimatedCard
              title="Team Collaboration"
              description="Share drafts, delegate emails, and collaborate seamlessly with your team without leaving your inbox."
              imageSrc="/landing/images/misc/s6.webp"
              className="h-80"
            />
            <AnimatedCard
              title="Enterprise Security"
              description="SOC 2 Type II certified, GDPR compliant, and end-to-end encrypted. Your data stays private."
              imageSrc="/landing/images/misc/s7.webp"
              className="h-80"
            />
            <AnimatedCard
              title="Lightning Fast"
              description="Built on modern infrastructure with 120ms average response time. Email at the speed of thought."
              imageSrc="/landing/images/misc/s8.webp"
              className="h-80"
            />
          </div>
        </div>
      </section>

      {/* Speakers Section */}
      <section id="section-team" className="bg-slate-950 section-dark text-light py-20 md:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-[#1E40AF] text-sm font-semibold uppercase tracking-wider mb-4">
              Our Team
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Meet the Founders
            </h2>
            <p className="text-white/70 text-lg">
              Built by email power users who were frustrated with existing solutions and decided to create something better.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="group relative rounded-2xl overflow-hidden">
              <div className="relative h-96">
                <Image
                  src="/images/trent-daniel.png"
                  alt="Trent T. Daniel"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#1E40AF]/0 to-[#1E40AF]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl p-4 text-center">
                  <h3 className="text-xl font-bold text-white mb-1">Trent T. Daniel</h3>
                  <p className="text-white/70 text-sm">Founder, BotMakers Inc.</p>
                </div>
              </div>
            </div>

            <div className="group relative rounded-2xl overflow-hidden">
              <div className="relative h-96">
                <Image
                  src="/images/sella-hall.png"
                  alt="Sella Hall"
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#1E40AF]/0 to-[#1E40AF]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl p-4 text-center">
                  <h3 className="text-xl font-bold text-white mb-1">Sella Hall</h3>
                  <p className="text-white/70 text-sm">Chief Experience Officer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Pricing Section */}
      <section id="section-pricing" className="bg-slate-950 section-dark text-light py-20 md:py-32 relative">
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
              Pricing Plans
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Choose Your Plan
            </h2>
            <p className="text-white/70 text-lg">
              Start free, upgrade when you're ready. All plans include 14-day free trial. No credit card required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <TicketCard
              title="Free"
              price="$0"
              features={[
                'Up to 100 emails per month',
                'Basic AI categorization',
                'Standard search',
                'Email support',
                '1 email account',
              ]}
              href="/signup"
            />
            <TicketCard
              title="Professional"
              price="$49"
              popular
              features={[
                'Unlimited emails',
                'Advanced AI features',
                'Semantic search',
                'Priority support',
                'Multiple accounts',
                'Custom templates',
                'Advanced analytics',
              ]}
              href="/signup"
            />
            <TicketCard
              title="Enterprise"
              price="Custom"
              period=""
              features={[
                'Everything in Professional',
                'Dedicated account manager',
                'Custom integrations',
                'SLA guarantee',
                'On-premise deployment',
                'Advanced security features',
                'Training & onboarding',
              ]}
              href="/contact"
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

      {/* Newsletter Section */}
      <NewsletterSignup />

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
              Ready to Transform Your Email?
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Start Your Free Trial Today
            </h2>
            <p className="text-white/70 text-lg mb-8">
              Join thousands of professionals using easeMail to reclaim their time and focus on what matters. 
              No credit card required. Cancel anytime.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                href="/signup"
                className="px-8 py-4 bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] text-white font-semibold rounded-full hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
              >
                Start Free Trial
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 bg-white/10 text-white font-semibold rounded-full ring-1 ring-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300"
              >
                Contact Sales
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 justify-center text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#1E40AF]" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#1E40AF]" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#1E40AF]" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
