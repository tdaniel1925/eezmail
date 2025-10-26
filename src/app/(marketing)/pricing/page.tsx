import Link from 'next/link';
import { Check, X, ArrowRight, Sparkles, Users } from 'lucide-react';

export const metadata = {
  title: 'Pricing - Imbox | Seat-Based Pricing That Scales',
  description: 'Simple seat-based pricing. Individual, Team, or Enterprise - pay only for what you need.',
};

const plans = [
  {
    name: 'Individual',
    price: '$45',
    period: '/month',
    seats: '1 user',
    pricePerSeat: '$45/user',
    description: 'Everything you need to supercharge your inbox',
    features: [
      'Unlimited email accounts',
      'Unlimited storage',
      'Full AI features (sentiment, summarization, writing assistance)',
      'Smart email categorization (Imbox/Feed/Paper Trail)',
      'Advanced search with RAG',
      'Contact intelligence & relationship scoring',
      'Email scheduling & templates',
      'Priority support',
      'All integrations included',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/signup?plan=individual',
    popular: false,
  },
  {
    name: 'Team',
    price: '$175',
    period: '/month',
    seats: 'Minimum 5 users',
    pricePerSeat: '$35/user',
    description: 'For growing teams with volume pricing',
    features: [
      'Everything in Individual',
      'Team collaboration features',
      'Shared contacts & labels',
      'Team inbox management',
      'Admin controls & permissions',
      'Usage analytics & insights',
      'Bulk actions & automation',
      'SMS at cost (pay-as-you-go)',
      'Volume pricing saves $10/user',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/signup?plan=team',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$150',
    period: '/month',
    seats: 'Minimum 6 users',
    pricePerSeat: '$25/user',
    description: 'Best value for large organizations',
    features: [
      'Everything in Team',
      'Best value ($25/user saves $20 vs Individual)',
      'Custom AI models & training',
      'SSO & SAML authentication',
      'Advanced security controls',
      'API access for integrations',
      'White-label options',
      'Dedicated account manager',
      '24/7 premium support',
      'SLA guarantees',
      'Custom contracts available',
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
              <Users className="w-4 h-4" />
              Simple Seat-Based Pricing
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-white">
              Pay Only for{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1E40AF] to-white">
                What You Need
              </span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed mb-8">
              All plans include unlimited features. Scale up or down based on your team size.
              No hidden fees, no feature limits.
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
                  <p className="text-slate-400 text-sm mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-slate-400">{plan.period}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Users className="w-4 h-4" />
                    <span>{plan.seats}</span>
                    <span className="text-[#1E40AF] font-medium ml-2">
                      {plan.pricePerSeat}
                    </span>
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
                How does seat-based pricing work?
              </h3>
              <p className="text-slate-400">
                You pay per user on your account. Individual is $45 for 1 user with everything included.
                Teams of 5+ users get volume pricing at $35/user ($175/month minimum). 
                Enterprises with 6+ users pay just $25/user ($150/month minimum).
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-white">
                What's included in all plans?
              </h3>
              <p className="text-slate-400">
                ALL plans include unlimited email accounts, unlimited storage, full AI features,
                smart categorization, advanced search, and priority support. There are no feature limits - 
                you only pay based on the number of users.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-white">
                Can I add or remove users anytime?
              </h3>
              <p className="text-slate-400">
                Yes! You can add or remove users at any time. Your billing will be prorated automatically.
                If you grow from Individual to Team size, you'll automatically get volume pricing.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-white">
                How is SMS billed?
              </h3>
              <p className="text-slate-400">
                SMS is billed separately at cost on a pay-as-you-go basis. You only pay for what you use.
                Typical cost is around $0.01 per SMS sent.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-white">
                Is there a free trial?
              </h3>
              <p className="text-slate-400">
                Yes! All plans come with a 14-day free trial with full access to all features.
                No credit card required to start.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-white">
                What payment methods do you accept?
              </h3>
              <p className="text-slate-400">
                We accept all major credit cards (Visa, Mastercard, Amex) via Stripe or Square.
                Enterprise customers can also be invoiced directly.
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
