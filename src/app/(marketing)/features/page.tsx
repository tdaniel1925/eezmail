import Link from 'next/link';
import {
  Sparkles,
  Search,
  Zap,
  Brain,
  Lock,
  Users,
  BarChart3,
  Globe,
  Mic,
  FileText,
  Clock,
  CheckCircle,
} from 'lucide-react';

export const metadata = {
  title: 'Features - easeMail | AI-Powered Email Management',
  description:
    'Discover how easeMail\'s AI features save you 10+ hours per week. Semantic search, smart compose, thread analysis, and more.',
};

export default function FeaturesPage() {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Semantic Search',
      description:
        'Find emails by meaning, not just keywords. Our RAG-powered search understands context and intent, returning relevant results in under 120ms.',
      benefits: ['Natural language queries', 'Contextual understanding', 'Instant results (<120ms)', 'Search across all history'],
    },
    {
      icon: Sparkles,
      title: 'Smart Compose',
      description:
        'AI writes context-aware email drafts based on your conversation history, writing style, and recipient preferences.',
      benefits: ['Context-aware suggestions', 'Learns your writing style', 'Multi-language support', 'Tone adjustment'],
    },
    {
      icon: FileText,
      title: 'Thread Summarization',
      description:
        'Get instant summaries of long email threads. See key decisions, action items, and important updates at a glance.',
      benefits: ['One-click summaries', 'Action item extraction', 'Key decision highlights', 'Saves 70% reading time'],
    },
    {
      icon: Zap,
      title: 'Auto-Categorization',
      description:
        'Emails automatically organized by importance, topic, and sender. Never miss critical messages buried in your inbox.',
      benefits: ['Priority inbox', 'Smart labels', 'Custom categories', 'Newsletter grouping'],
    },
    {
      icon: Mic,
      title: 'Voice Dictation',
      description:
        'Compose emails by speaking. Our voice-to-text is optimized for professional communication with 98% accuracy.',
      benefits: ['98% accuracy', 'Punctuation auto-added', 'Multiple languages', 'Background noise filtering'],
    },
    {
      icon: Search,
      title: 'Advanced Filters',
      description:
        'Powerful filtering and search operators. Find exactly what you need with boolean logic, date ranges, and custom attributes.',
      benefits: ['Boolean operators', 'Date range filters', 'Attachment search', 'Sender clustering'],
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description:
        'Share inboxes, delegate emails, and collaborate on responses. Perfect for support teams and shared accounts.',
      benefits: ['Shared inboxes', 'Email delegation', 'Internal notes', 'Team analytics'],
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description:
        'Understand your email patterns. Track response times, identify bottlenecks, and optimize your workflow.',
      benefits: ['Response time tracking', 'Volume analytics', 'Peak hour identification', 'Productivity scores'],
    },
    {
      icon: Lock,
      title: 'Enterprise Security',
      description:
        'SOC 2 Type II certified, GDPR compliant, with end-to-end encryption. Your data stays private and secure.',
      benefits: ['AES-256 encryption', 'SOC 2 Type II', 'GDPR compliant', 'SSO/SAML support'],
    },
    {
      icon: Globe,
      title: 'Multi-Account Management',
      description:
        'Manage unlimited email accounts from Gmail, Outlook, IMAP, and more—all in one unified interface.',
      benefits: ['Unlimited accounts', 'Unified inbox', 'Cross-account search', 'Account switching'],
    },
    {
      icon: Clock,
      title: 'Scheduled Sending',
      description:
        'Schedule emails to send later. Perfect for reaching recipients in different time zones or sending reminders.',
      benefits: ['Flexible scheduling', 'Timezone aware', 'Recurring emails', 'Send cancellation'],
    },
    {
      icon: CheckCircle,
      title: 'Smart Templates',
      description:
        'Save and reuse common responses with dynamic variables. Templates learn and improve from your usage patterns.',
      benefits: ['Dynamic variables', 'Auto-suggestions', 'Team templates', 'Version history'],
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
              Powered by Advanced AI
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-white">
              Features That Save You{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF4C5A] to-white">
                10+ Hours Per Week
              </span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed mb-8">
              easeMail combines cutting-edge AI with powerful productivity tools to transform how you work with email.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF4C5A] text-white px-8 py-4 text-lg font-medium hover:bg-[#FF4C5A]/90 transition"
              >
                Start Free Trial
              </Link>
              <Link
                href="/#pricing"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 text-white ring-1 ring-white/15 px-8 py-4 text-lg font-medium hover:bg-white/15 transition"
              >
                See Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-8 hover:ring-white/20 transition"
              >
                <div className="w-12 h-12 rounded-full bg-[#FF4C5A]/10 ring-1 ring-[#FF4C5A]/20 flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-[#FF4C5A]" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                <p className="text-slate-400 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-[#FF4C5A]/20 to-transparent ring-1 ring-[#FF4C5A]/30 p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to Transform Your Email?</h2>
            <p className="text-xl text-slate-300 mb-8">
              Join thousands of professionals saving 10+ hours per week with easeMail
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-slate-900 px-8 py-4 text-lg font-semibold hover:bg-slate-100 transition"
            >
              Start Free Trial
            </Link>
            <p className="text-sm text-slate-400 mt-4">14-day free trial • No credit card required</p>
          </div>
        </div>
      </section>
    </div>
  );
}
