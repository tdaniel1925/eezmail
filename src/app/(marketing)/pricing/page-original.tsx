import Link from 'next/link';
import { Check, X, ArrowRight, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Pricing - easeMail | Simple, Transparent Pricing',
  description:
    'Start free, upgrade when ready. easeMail offers flexible pricing for individuals and teams. 50% less than Superhuman with more features.',
};

export default function PricingPage() {
  const renderCell = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-400 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-slate-600 mx-auto" />
      );
    }
    return <span className="text-sm text-slate-300">{value}</span>;
  };
  const plans = [
    {
      name: 'Starter',
      price: '$0',
      period: '/month',
      description: 'Perfect for trying out easeMail',
      features: [
        { text: 'Up to 10 emails processed per day', included: true },
        { text: 'Basic AI features', included: true },
        { text: 'Standard templates', included: true },
        { text: 'Email support', included: true },
        { text: 'Single email account', included: true },
        { text: 'Mobile app access', included: true },
        { text: 'Advanced AI (RAG, semantic search)', included: false },
        { text: 'Unlimited processing', included: false },
        { text: 'Priority support', included: false },
        { text: 'Team features', included: false },
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
        { text: 'Unlimited email processing', included: true },
        { text: 'Advanced AI (RAG, semantic search)', included: true },
        { text: 'Smart compose with context', included: true },
        { text: 'Thread summarization', included: true },
        { text: 'Voice dictation', included: true },
        { text: 'Custom templates', included: true },
        { text: 'Priority support (24/7)', included: true },
        { text: 'Unlimited email accounts', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Scheduled sending', included: true },
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
        { text: 'Everything in Professional', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'SSO/SAML authentication', included: true },
        { text: 'Custom integrations', included: true },
        { text: 'On-premise deployment option', included: true },
        { text: 'Custom data retention', included: true },
        { text: 'SLA guarantee (99.9% uptime)', included: true },
        { text: 'Advanced security controls', included: true },
        { text: 'Team training & onboarding', included: true },
        { text: 'Volume discounts', included: true },
      ],
      cta: 'Contact Sales',
      ctaLink: '/contact',
      popular: false,
    },
  ];

  const comparisonFeatures = [
    { category: 'Core Features', items: [
      { name: 'Email accounts', starter: '1', pro: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Emails processed per day', starter: '10', pro: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'AI semantic search', starter: false, pro: true, enterprise: true },
      { name: 'Smart compose', starter: 'Basic', pro: 'Advanced', enterprise: 'Advanced' },
      { name: 'Thread summarization', starter: false, pro: true, enterprise: true },
      { name: 'Voice dictation', starter: false, pro: true, enterprise: true },
    ]},
    { category: 'Productivity', items: [
      { name: 'Templates', starter: 'Standard', pro: 'Custom', enterprise: 'Team templates' },
      { name: 'Scheduled sending', starter: false, pro: true, enterprise: true },
      { name: 'Bulk operations', starter: false, pro: true, enterprise: true },
      { name: 'Keyboard shortcuts', starter: true, pro: true, enterprise: true },
      { name: 'Offline mode', starter: false, pro: true, enterprise: true },
    ]},
    { category: 'Team & Enterprise', items: [
      { name: 'Team collaboration', starter: false, pro: false, enterprise: true },
      { name: 'Shared inboxes', starter: false, pro: false, enterprise: true },
      { name: 'SSO/SAML', starter: false, pro: false, enterprise: true },
      { name: 'Custom data retention', starter: false, pro: false, enterprise: true },
      { name: 'Dedicated support', starter: false, pro: false, enterprise: true },
      { name: 'SLA guarantee', starter: false, pro: false, enterprise: '99.9%' },
    ]},
    { category: 'Support', items: [
      { name: 'Email support', starter: true, pro: true, enterprise: true },
      { name: 'Priority support', starter: false, pro: '24/7', enterprise: '24/7' },
      { name: 'Account manager', starter: false, pro: false, enterprise: 'Dedicated' },
      { name: 'Training & onboarding', starter: false, pro: false, enterprise: true },
    ]},
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
              Simple, Transparent Pricing
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Choose the Plan That{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF4C5A] to-white">
                Fits Your Needs
              </span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed mb-8">
              Start free, upgrade when you're ready. All plans include a 14-day free trial—no credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-3xl backdrop-blur-md p-8 flex flex-col ${
                  plan.popular
                    ? 'bg-gradient-to-b from-white/10 to-white/5 ring-2 ring-[#FF4C5A]/50 relative'
                    : 'bg-slate-900/60 ring-1 ring-white/10'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FF4C5A] px-4 py-1.5 text-xs font-semibold text-white">
                      ⭐ MOST POPULAR
                    </span>
                  </div>
                )}
                
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mb-6">{plan.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-slate-400">{plan.period}</span>}
                  </div>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-slate-200' : 'text-slate-500'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.ctaLink}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition ${
                    plan.popular
                      ? 'bg-[#FF4C5A] text-white hover:bg-[#FF4C5A]/90'
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

      {/* Feature Comparison Table */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Detailed Feature Comparison</h2>
            <p className="text-slate-400">See exactly what's included in each plan</p>
          </div>

          <div className="rounded-3xl bg-slate-900/40 ring-1 ring-white/10 backdrop-blur-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="p-6 text-left text-sm font-semibold text-slate-300">Feature</th>
                    <th className="p-6 text-center text-sm font-semibold text-white min-w-[140px]">Starter</th>
                    <th className="p-6 text-center text-sm font-semibold text-white min-w-[140px] bg-[#FF4C5A]/5">
                      Professional
                    </th>
                    <th className="p-6 text-center text-sm font-semibold text-white min-w-[140px]">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((section) => (
                    <>
                      <tr key={section.category} className="border-t border-white/10 bg-white/5">
                        <td colSpan={4} className="p-4 text-sm font-semibold text-white">
                          {section.category}
                        </td>
                      </tr>
                      {section.items.map((item, idx) => (
                        <tr key={`${section.category}-${idx}`} className="border-t border-white/5">
                          <td className="p-4 text-sm text-slate-300">{item.name}</td>
                          <td className="p-4 text-center">{renderCell(item.starter)}</td>
                          <td className="p-4 text-center bg-[#FF4C5A]/5">{renderCell(item.pro)}</td>
                          <td className="p-4 text-center">{renderCell(item.enterprise)}</td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 md:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Pricing FAQs</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Can I switch plans anytime?',
                a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards (Visa, Mastercard, Amex) and can invoice enterprise customers via ACH or wire transfer.',
              },
              {
                q: 'Is there a free trial?',
                a: 'Yes! All paid plans come with a 14-day free trial with full access to all features. No credit card required to start.',
              },
              {
                q: 'Do you offer discounts for annual billing?',
                a: 'Yes! Save 20% when you pay annually. Annual plans are billed as $470/year (vs $588 monthly) for Professional.',
              },
              {
                q: 'What happens when I cancel?',
                a: 'You can cancel anytime. You'll have access until the end of your billing period, and we'll export all your data if needed.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-6">
                <h3 className="text-lg font-semibold mb-2">{faq.q}</h3>
                <p className="text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-[#FF4C5A]/20 to-transparent ring-1 ring-[#FF4C5A]/30 p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-slate-300 mb-8">
              Start your 14-day free trial today—no credit card required
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

