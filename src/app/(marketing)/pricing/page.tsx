'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Users } from 'lucide-react';

const plans = [
  {
    name: 'Individual',
    price: '$45',
    annualPrice: '$36',
    period: '/user/month',
    seats: '1 user',
    pricePerSeat: '$45/user',
    annualSavings: '20%',
    description: 'Perfect for solo professionals',
    features: [
      'Unlimited email accounts',
      'Unlimited storage',
      'Full AI features (sentiment analysis, summarization, writing assistance)',
      'Smart email categorization (Imbox/Feed/Paper Trail)',
      'Advanced search with RAG',
      'Contact intelligence & relationship scoring',
      'Email scheduling & smart templates',
      'Voice message integration',
      'Mobile & desktop apps',
      'SMS at custom admin-set rate',
      'All integrations included',
      'Priority email support',
    ],
    cta: 'Start 30-Day Free Trial',
    ctaLink: '/signup?plan=individual',
    popular: false,
  },
  {
    name: 'Team',
    price: '$35',
    annualPrice: '$28',
    period: '/user/month',
    seats: '2-5 users',
    pricePerSeat: '$35/user',
    annualSavings: '20%',
    minSeats: 2,
    description: 'For small teams that collaborate',
    features: [
      'Everything in Individual',
      'Save $10/user vs Individual',
      'Team collaboration features',
      'Shared contacts & labels',
      'Team inbox management',
      'Admin controls & user permissions',
      'Usage analytics & insights dashboard',
      'Bulk actions & automation rules',
      'Shared email templates',
      'Team activity reporting',
      'SMS at custom admin-set rate',
      'Priority email support',
    ],
    cta: 'Start 30-Day Free Trial',
    ctaLink: '/signup?plan=team',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$30',
    annualPrice: '$24',
    period: '/user/month',
    seats: '6-15 users',
    pricePerSeat: '$30/user',
    annualSavings: '20%',
    minSeats: 6,
    description: 'Best value for growing organizations',
    features: [
      'Everything in Team',
      'Save $15/user vs Individual',
      'Advanced security & compliance',
      'SSO & SAML authentication',
      'Custom AI model training',
      'API access for custom integrations',
      'Advanced workflow automation',
      'Dedicated account manager',
      'White-label options available',
      'SMS at custom admin-set rate',
      '24/7 priority support',
      'SLA guarantees',
    ],
    cta: 'Start 30-Day Free Trial',
    ctaLink: '/signup?plan=enterprise',
    popular: false,
  },
  {
    name: 'Platform',
    price: '$25',
    annualPrice: '$20',
    period: '/user/month',
    seats: '15+ users',
    pricePerSeat: '$25/user',
    annualSavings: '20%',
    minSeats: 15,
    description: 'Maximum value for large teams',
    features: [
      'Everything in Enterprise',
      'Best price - save $20/user vs Individual',
      'Unlimited user seats',
      'Custom contract terms',
      'Volume discount pricing',
      'Premium onboarding & training',
      'Custom feature development',
      'Dedicated technical support',
      'Advanced security audits',
      'SMS at custom admin-set rate',
      'White-glove support',
      'Custom SLAs',
    ],
    cta: 'Contact Sales',
    ctaLink: '/contact',
    popular: false,
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    'monthly'
  );

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E40AF]/10 to-transparent"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-white/80 ring-1 ring-white/10 mb-6">
              <Users className="w-4 h-4" />
              Simple Per-User Pricing
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-white">
              One Price,{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1E40AF] to-white">
                Everything Included
              </span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed mb-8">
              All plans include unlimited everything. Pay only per user. Lower
              prices as your team grows. 30-day free trial included.
            </p>

            {/* Billing Cycle Toggle */}
            <div className="inline-flex items-center gap-4 bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md rounded-full p-2">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
                  billingCycle === 'monthly'
                    ? 'bg-[#1E40AF] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2 ${
                  billingCycle === 'annual'
                    ? 'bg-[#1E40AF] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Annual
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards with Features */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl backdrop-blur-md p-6 flex flex-col ${
                  plan.popular
                    ? 'bg-gradient-to-b from-white/10 to-white/5 ring-2 ring-[#1E40AF]/50 relative scale-105'
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

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2 text-white">
                    {plan.name}
                  </h3>
                  <p className="text-slate-400 text-xs mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-bold text-white">
                      {billingCycle === 'monthly'
                        ? plan.price
                        : plan.annualPrice}
                    </span>
                    <span className="text-slate-400 text-sm">
                      {plan.period}
                    </span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className="text-xs text-green-400 mb-2">
                      Save {plan.annualSavings} annually
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Users className="w-3 h-3" />
                    <span>{plan.seats}</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-200">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.ctaLink}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    plan.popular
                      ? 'bg-[#1E40AF] text-white hover:bg-[#1E40AF]/90'
                      : 'bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
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
                How does per-user pricing work?
              </h3>
              <p className="text-slate-400">
                You pay per user on your account. Pricing automatically adjusts
                based on team size: Individual ($45/user), Team 2-5 users
                ($35/user), Enterprise 6-15 users ($30/user), or Platform 15+
                users ($25/user). Save 20% when billed annually.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-white">
                What's included in all plans?
              </h3>
              <p className="text-slate-400">
                ALL plans include unlimited email accounts, unlimited storage,
                full AI features, smart categorization, advanced search, contact
                intelligence, email scheduling, voice messages, and all
                integrations. The only difference is the price per user based on
                team size.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-white">
                Can I add or remove users anytime?
              </h3>
              <p className="text-slate-400">
                Yes! You can add or remove users at any time. Your billing will
                be prorated automatically. If you grow from Individual to Team
                size, you'll automatically get the lower per-user rate.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-white">
                How is SMS billed?
              </h3>
              <p className="text-slate-400">
                SMS is billed separately at a custom rate set by your admin.
                This allows flexible pricing based on your usage. Typical SMS
                costs range from $0.01-$0.02 per message depending on carrier.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-white">
                Is there a free trial?
              </h3>
              <p className="text-slate-400">
                Yes! All plans come with a 30-day free trial with full access to
                all features. No credit card required to start your trial.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-white">
                What payment methods do you accept?
              </h3>
              <p className="text-slate-400">
                We accept all major credit cards (Visa, Mastercard, Amex,
                Discover) via Stripe or Square. Enterprise and Platform
                customers can also be invoiced directly with NET 30 terms.
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
              Start your 30-day free trial today. No credit card required.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-slate-900 px-8 py-4 text-lg font-semibold hover:bg-slate-100 transition"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
