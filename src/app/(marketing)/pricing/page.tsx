import Link from 'next/link';
import { Check, X, ArrowRight, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Pricing - easeMail | Simple, Transparent Pricing',
  description: 'Start free, upgrade when ready.',
};

const plans = [
  {
    name: 'Starter',
    price: '$0',
    period: '/month',
    description: 'Perfect for trying out easeMail',
    features: [
      'Up to 10 emails per day',
      'Basic AI features',
      'Standard templates',
      'Email support',
      'Single email account',
      'Mobile app access',
    ],
    cta: 'Start Free',
    ctaLink: '/signup',
    popular: false,
  },
  {
    name: 'Professional',
    price: '$49',
    period: '/month',
    description: 'For professionals who need power and speed',
    features: [
      'Unlimited email processing',
      'Advanced AI (RAG, semantic search)',
      'Smart compose with context',
      'Thread summarization',
      'Voice dictation',
      'Custom templates',
      'Priority support (24/7)',
      'Unlimited email accounts',
      'Advanced analytics',
      'Scheduled sending',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/signup',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For teams and organizations',
    features: [
      'Everything in Professional',
      'Dedicated account manager',
      'SSO/SAML authentication',
      'Custom integrations',
      'On-premise deployment',
      'Custom data retention',
      'SLA guarantee (99.9% uptime)',
      'Advanced security controls',
      'Team training',
      'Volume discounts',
    ],
    cta: 'Contact Sales',
    ctaLink: '/contact',
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E40AF]/10 to-transparent"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-white/80 ring-1 ring-white/10 mb-6">
              <Sparkles className="w-4 h-4" />
              Simple, Transparent Pricing
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-white">
              Choose the Plan That{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1E40AF] to-white">
                Fits Your Needs
              </span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed mb-8">
              Start free, upgrade when you are ready. All plans include a 14-day
              free trial.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards with Features */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl backdrop-blur-md p-8 flex flex-col ${
                  plan.popular
                    ? 'bg-gradient-to-b from-white/10 to-white/5 ring-2 ring-[#1E40AF]/50 relative'
                    : 'bg-slate-900/60 ring-1 ring-white/10'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#1E40AF] px-4 py-1.5 text-xs font-semibold text-white">
                      ⭐ MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2 text-white">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mb-6">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-slate-400">{plan.period}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-200">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.ctaLink}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition ${
                    plan.popular
                      ? 'bg-[#1E40AF] text-white hover:bg-[#1E40AF]/90'
                      : 'bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">
            Pricing FAQs
          </h2>
          <div className="space-y-6">
            <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-white">
                Can I switch plans anytime?
              </h3>
              <p className="text-slate-400">
                Yes! You can upgrade or downgrade your plan at any time. Changes
                take effect immediately.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-white">
                What payment methods do you accept?
              </h3>
              <p className="text-slate-400">
                We accept all major credit cards (Visa, Mastercard, Amex) and
                can invoice enterprise customers.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-white">
                Is there a free trial?
              </h3>
              <p className="text-slate-400">
                Yes! All paid plans come with a 14-day free trial with full
                access to all features.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-white">
                Do you offer discounts for annual billing?
              </h3>
              <p className="text-slate-400">
                Yes! Save 20% when you pay annually. $470/year vs $588 for
                monthly billing.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-white">
                What happens when I cancel?
              </h3>
              <p className="text-slate-400">
                You can cancel anytime. You will have access until the end of
                your billing period.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-[#1E40AF]/20 to-transparent ring-1 ring-[#1E40AF]/30 p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Start your 14-day free trial today
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-slate-900 px-8 py-4 text-lg font-semibold hover:bg-slate-100 transition"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
