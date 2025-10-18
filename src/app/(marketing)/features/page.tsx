import { Bot, Zap, Shield, Calendar, Search, MessageSquare, Users, BarChart3 } from 'lucide-react';

export const metadata = {
  title: 'Features - easeMail AI-Powered Email Client',
  description: 'Discover easeMail\'s powerful features: RAG semantic search, AI assistant, smart compose, enterprise admin tools, and more.',
};

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="z-10 relative pt-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto [animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both]">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Superhuman Speed Meets <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF4C5A] to-white">Enterprise-Grade AI</span>
            </h1>
            <p className="text-lg text-white/70">
              Every feature designed to save time, boost productivity, and give you complete control over your inbox.
            </p>
          </div>
        </div>
      </section>

      {/* AI-Powered Productivity */}
      <section className="z-10 mt-24 py-12 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 [animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both] animate-on-scroll">
            <span className="inline-block px-3 py-1 rounded-full bg-[#FF4C5A]/20 text-[#FF4C5A] text-sm font-semibold mb-4">
              AI-Powered Productivity
            </span>
            <h2 className="text-4xl font-bold text-white mb-4">Intelligence That Works for You</h2>
            <p className="text-lg text-white/70 max-w-2xl">
              Advanced AI features that understand context, learn from your patterns, and make email management effortless.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: <Search className="h-10 w-10" />,
                title: 'RAG Semantic Search',
                desc: 'Find emails by meaning, not just keywords. Our Retrieval-Augmented Generation search understands context and finds relevant messages instantly.',
                features: ['Natural language queries', 'Context-aware results', 'Cross-email insights', 'Sub-100ms response time'],
              },
              {
                icon: <Bot className="h-10 w-10" />,
                title: 'AI Assistant Chat',
                desc: 'Chat with your inbox. Ask questions, get summaries, draft responses, and extract insights from your email history.',
                features: ['Thread summaries', 'Smart Q&A', 'Draft suggestions', 'Relationship analysis'],
              },
              {
                icon: <MessageSquare className="h-10 w-10" />,
                title: 'Smart Compose',
                desc: 'Write emails 10x faster with AI-powered suggestions. Context-aware completions understand your writing style and intent.',
                features: ['Real-time suggestions', 'Tone adjustment', 'Grammar correction', 'Template generation'],
              },
              {
                icon: <BarChart3 className="h-10 w-10" />,
                title: 'Auto-Categorization',
                desc: 'Automatic email screening and prioritization. Important messages reach you first, noise gets filtered automatically.',
                features: ['Smart folders', 'Priority scoring', 'VIP detection', 'Spam filtering'],
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="border-gradient before:rounded-2xl bg-white/5 rounded-2xl p-8 backdrop-blur hover:bg-white/10 transition [animation:fadeSlideIn_0.5s_ease-in-out_0.2s_both] animate-on-scroll"
                style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
              >
                <div className="text-[#FF4C5A] mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/70 mb-4">{feature.desc}</p>
                <ul className="space-y-2">
                  {feature.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#FF4C5A]" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Speed & Efficiency */}
      <section className="z-10 mt-24 py-12 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 [animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both] animate-on-scroll">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-semibold mb-4">
              Speed & Efficiency
            </span>
            <h2 className="text-4xl font-bold text-white mb-4">Work at the Speed of Thought</h2>
            <p className="text-lg text-white/70 max-w-2xl">
              Keyboard shortcuts, bulk operations, and lightning-fast performance that keeps up with you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="h-8 w-8" />,
                title: 'Keyboard Shortcuts',
                desc: 'Every action is one keystroke away. Navigate, compose, archive, and search without touching your mouse.',
                stat: '50+',
                statLabel: 'Shortcuts',
              },
              {
                icon: <MessageSquare className="h-8 w-8" />,
                title: 'Voice Dictation',
                desc: 'Compose emails hands-free with accurate voice-to-text. Perfect for long emails or mobile use.',
                stat: '95%',
                statLabel: 'Accuracy',
              },
              {
                icon: <Calendar className="h-8 w-8" />,
                title: 'Scheduled Send',
                desc: 'Write now, send later. Schedule emails for optimal delivery times or follow-ups.',
                stat: 'Smart',
                statLabel: 'Timing',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="border-gradient before:rounded-2xl bg-white/5 rounded-2xl p-6 backdrop-blur [animation:fadeSlideIn_0.5s_ease-in-out_0.2s_both] animate-on-scroll"
                style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
              >
                <div className="text-emerald-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/60 mb-4">{feature.desc}</p>
                <div className="pt-4 border-t border-white/10">
                  <div className="text-3xl font-bold text-white">{feature.stat}</div>
                  <div className="text-xs text-white/50">{feature.statLabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Features */}
      <section className="z-10 mt-24 py-12 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 [animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both] animate-on-scroll">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-semibold mb-4">
              Enterprise Features
            </span>
            <h2 className="text-4xl font-bold text-white mb-4">Built for Teams, Scales with You</h2>
            <p className="text-lg text-white/70 max-w-2xl">
              Complete admin control, usage analytics, and security features enterprises demand.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: <Users className="h-10 w-10" />,
                title: 'Team Management',
                desc: 'Centralized admin dashboard to manage users, permissions, and billing. Add or remove team members in seconds.',
              },
              {
                icon: <BarChart3 className="h-10 w-10" />,
                title: 'Usage Analytics',
                desc: 'Track email volume, response times, and productivity metrics. Understand team patterns and optimize workflows.',
              },
              {
                icon: <Shield className="h-10 w-10" />,
                title: 'Role-Based Access',
                desc: 'Granular permissions and access controls. Define admin, manager, and user roles with custom permissions.',
              },
              {
                icon: <Shield className="h-10 w-10" />,
                title: 'SSO & SAML',
                desc: 'Single sign-on integration with your identity provider. Enforce security policies across your organization.',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="border-gradient before:rounded-2xl bg-white/5 rounded-2xl p-8 backdrop-blur [animation:fadeSlideIn_0.5s_ease-in-out_0.2s_both] animate-on-scroll"
                style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
              >
                <div className="text-blue-400 mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/60">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="z-10 mt-24 py-12 relative">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="border-gradient before:rounded-2xl bg-gradient-to-br from-[#FF4C5A]/20 to-white/5 rounded-2xl p-12 text-center backdrop-blur [animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both] animate-on-scroll">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Experience the Difference
            </h2>
            <p className="text-lg text-white/70 mb-8">
              Try all features free for 14 days. No credit card required.
            </p>
            <a
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#FF4C5A] hover:bg-[#FF4C5A]/90 text-white font-semibold rounded-full transition"
            >
              Start Free Trial
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

