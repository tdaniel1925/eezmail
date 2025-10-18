import Link from 'next/link';
import { ArrowRight, Shield, Zap, Users, Clock, Check, ChevronDown } from 'lucide-react';
import { AnimatedButton } from '@/components/marketing/AnimatedButton';
import { ComparisonTable } from '@/components/marketing/ComparisonTable';
import { ROICalculator } from '@/components/marketing/ROICalculator';

export const metadata = {
  title: 'easeMail - Save 10 Hours Per Week with AI-Powered Email',
  description: 'The fastest, most intelligent email client for teams. AI-powered productivity, enterprise security, and 50% less cost than Superhuman.',
};

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="z-10 relative">
        <div className="lg:px-8 lg:ml-auto lg:mr-auto lg:mt-24 max-w-7xl mt-24 mr-auto ml-auto pr-8 pl-8">
          {/* Announcement */}
          <div className="xl:text-center max-w-3xl mr-auto ml-auto [animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both]">
            <div className="inline-flex border-white/[0.06] border-gradient before:rounded-full bg-white/5 rounded-full mb-6 pt-1.5 pr-3 pb-1.5 pl-3 backdrop-blur gap-x-2 gap-y-2 items-center">
              <span className="text-xs text-white/70">
                🚀 New: AI Thread Analysis & RAG-powered search
              </span>
            </div>
          </div>

          <div className="text-center max-w-4xl mr-auto ml-auto">
            <h1 className="leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl lg:ml-auto lg:mr-auto lg:font-normal [animation:fadeSlideIn_0.5s_ease-in-out_0.2s_both] text-4xl max-w-3xl mr-auto ml-auto drop-shadow-xl tracking-tighter">
              Save <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF4C5A] to-white tracking-tighter">10 hours per week</span> with AI-powered email
            </h1>
            <p className="md:text-lg text-base text-white/70 max-w-2xl mt-6 mr-auto ml-auto [animation:fadeSlideIn_0.5s_ease-in-out_0.3s_both]">
              easeMail combines superhuman speed with enterprise-grade AI. Get semantic search, smart compose, and powerful analytics—all at 50% the cost of alternatives.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row max-w-xl mt-8 mr-auto ml-auto w-full gap-x-3 gap-y-3 items-center justify-center [animation:fadeSlideIn_0.5s_ease-in-out_0.4s_both]">
              <Link href="/signup">
                <AnimatedButton className="min-w-[180px]">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </AnimatedButton>
              </Link>
              <Link href="#demo">
                <AnimatedButton variant="secondary" className="min-w-[180px]">
                  Watch Demo
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </AnimatedButton>
              </Link>
            </div>

            {/* Trust */}
            <div className="flex [animation:fadeSlideIn_0.5s_ease-in-out_0.5s_both] text-xs text-white/60 mt-6 gap-x-4 gap-y-4 items-center justify-center flex-wrap">
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <Shield className="h-4 w-4" />
                Bank-grade security
              </span>
              <span className="inline-flex items-center gap-1">
                <Check className="h-4 w-4" />
                14-day free trial
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-4 w-4" />
                Trusted by 1000+ teams
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="z-10 xl:py-24 mt-24 pt-12 pb-12 relative">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="[animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both] animate-on-scroll">
            <ROICalculator />
          </div>
        </div>
      </section>

      {/* Why easeMail Beats Superhuman */}
      <section className="z-10 xl:py-24 mt-24 pt-12 pb-12 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12 [animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both] animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Why Choose easeMail Over Superhuman
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              More features. Better AI. Half the price.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'More Affordable',
                desc: '$15-25/mo vs $30/mo',
                icon: <Clock className="h-8 w-8" />,
                highlight: '50% Savings',
              },
              {
                title: 'Better AI',
                desc: 'RAG semantic search vs basic search',
                icon: <Zap className="h-8 w-8" />,
                highlight: '10x Smarter',
              },
              {
                title: 'No Lock-In',
                desc: 'Export data anytime. Own your emails.',
                icon: <Shield className="h-8 w-8" />,
                highlight: 'Your Data',
              },
              {
                title: 'Enterprise Ready',
                desc: 'Admin dashboard, analytics, RBAC',
                icon: <Users className="h-8 w-8" />,
                highlight: 'Team Tools',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="border-gradient before:rounded-2xl bg-white/5 rounded-2xl p-6 backdrop-blur hover:bg-white/10 transition [animation:fadeSlideIn_0.5s_ease-in-out_0.2s_both] animate-on-scroll"
                style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
              >
                <div className="text-[#FF4C5A] mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/60 mb-3">{item.desc}</p>
                <span className="inline-block px-3 py-1 rounded-full bg-[#FF4C5A]/20 text-[#FF4C5A] text-xs font-semibold">
                  {item.highlight}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="z-10 xl:py-24 mt-24 pt-12 pb-12 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12 [animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both] animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              How We Compare
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              See why easeMail is the best choice for productivity-focused teams
            </p>
          </div>

          <div className="border-gradient before:rounded-2xl bg-white/5 rounded-2xl p-6 md:p-8 backdrop-blur [animation:fadeSlideIn_0.5s_ease-in-out_0.2s_both] animate-on-scroll">
            <ComparisonTable />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="z-10 xl:py-24 mt-24 pt-12 pb-12 relative">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="text-center mb-12 [animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both] animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4 [animation:fadeSlideIn_0.5s_ease-in-out_0.2s_both] animate-on-scroll">
            {[
              {
                q: 'How is easeMail different from Gmail?',
                a: 'easeMail adds powerful AI (RAG search, smart compose, thread analysis), lightning-fast keyboard shortcuts, and enterprise-grade analytics on top of your existing email. Gmail is basic; easeMail is built for power users.',
              },
              {
                q: 'Why choose easeMail over Superhuman?',
                a: 'We offer the same speed and shortcuts but add advanced AI features (RAG semantic search, auto-categorization), better team management tools, and we cost 50% less at $15-25/user/month vs $30.',
              },
              {
                q: 'Is my email data private and secure?',
                a: 'Absolutely. We never scan your emails for advertising. All data is encrypted end-to-end, and we comply with GDPR, CCPA, and SOC 2 standards. You can export or delete your data anytime.',
              },
              {
                q: 'Can I migrate from Gmail/Outlook/Superhuman?',
                a: 'Yes! Migration takes under 5 minutes. Connect your account, import your emails, and you\'re ready. We support Gmail, Outlook, and any IMAP-compatible email.',
              },
              {
                q: 'What\'s the learning curve?',
                a: 'If you know Gmail or Outlook, you already know 80% of easeMail. The interface is familiar, and keyboard shortcuts are optional. Most users are fully productive within a day.',
              },
              {
                q: 'Do you offer a free trial?',
                a: 'Yes! 14 days, no credit card required. Try all premium features including AI search, smart compose, and team analytics.',
              },
              {
                q: 'What support do you provide?',
                a: '24/7 email and chat support for all users. Enterprise customers get dedicated support and a customer success manager.',
              },
            ].map((faq, idx) => (
              <details
                key={idx}
                className="border-gradient before:rounded-xl bg-white/5 rounded-xl p-6 backdrop-blur group"
              >
                <summary className="flex justify-between items-center cursor-pointer text-white font-semibold">
                  {faq.q}
                  <ChevronDown className="h-5 w-5 text-white/60 group-open:rotate-180 transition" />
                </summary>
                <p className="mt-4 text-white/70 text-sm leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Migration Promise */}
      <section className="z-10 xl:py-24 mt-24 pt-12 pb-12 relative">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="border-gradient before:rounded-2xl bg-gradient-to-br from-[#FF4C5A]/20 to-white/5 rounded-2xl p-8 md:p-12 backdrop-blur [animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both] animate-on-scroll">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                Switch in Under 5 Minutes
              </h2>
              <p className="text-lg text-white/70">
                Migrate from any email client with zero downtime
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[
                { step: '1', title: 'Connect', desc: 'Link your Gmail, Outlook, or IMAP account' },
                { step: '2', title: 'Import', desc: 'We sync your emails securely in the background' },
                { step: '3', title: 'Work Smarter', desc: 'Start using AI-powered productivity features' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#FF4C5A] text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-white/60">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <span className="inline-flex items-center gap-2 text-sm text-emerald-300">
                <Shield className="h-4 w-4" />
                Bank-grade encryption during transfer
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="z-10 xl:py-24 mt-24 pt-12 pb-12 relative">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <div className="[animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both] animate-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Ready to Transform Your Email?
            </h2>
            <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
              Join 1000+ teams saving 10+ hours per week with easeMail
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link href="/signup">
                <AnimatedButton className="min-w-[200px]">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </AnimatedButton>
              </Link>
              <Link href="mailto:sales@easemail.com">
                <AnimatedButton variant="secondary" className="min-w-[200px]">
                  Talk to Sales
                </AnimatedButton>
              </Link>
            </div>

            <p className="text-sm text-white/50">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

