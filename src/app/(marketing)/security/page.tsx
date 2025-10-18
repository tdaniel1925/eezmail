import { Shield, Lock, Eye, Server, FileCheck, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Security - easeMail Enterprise-Grade Protection',
  description: 'Bank-grade security, GDPR compliance, and zero email scanning. Your data stays private and secure.',
};

export default function SecurityPage() {
  return (
    <>
      {/* Hero */}
      <section className="z-10 relative pt-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto [animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both]">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Shield className="h-12 w-12 text-emerald-400" />
              <Lock className="h-12 w-12 text-emerald-400" />
              <Eye className="h-12 w-12 text-emerald-400 opacity-30" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Enterprise-Grade Security <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-white">Without Compromise</span>
            </h1>
            <p className="text-lg text-white/70 mb-8">
              Bank-level encryption, zero email scanning, and complete data privacy. Your emails are yours alone.
            </p>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {['GDPR', 'CCPA', 'SOC 2', 'ISO 27001'].map((badge) => (
                <div
                  key={badge}
                  className="px-6 py-3 bg-emerald-500/20 border-2 border-emerald-500/50 rounded-lg text-emerald-300 font-semibold"
                >
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Architecture */}
      <section className="z-10 mt-24 py-12 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 [animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both] animate-on-scroll">
            <h2 className="text-4xl font-bold text-white mb-4">Security Architecture</h2>
            <p className="text-lg text-white/70 max-w-2xl">
              Multi-layered protection that keeps your data safe at every step.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Lock className="h-8 w-8" />,
                title: 'End-to-End Encryption',
                desc: 'All data encrypted in transit (TLS 1.3) and at rest (AES-256). Your emails are unreadable to anyone but you.',
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: 'Zero-Knowledge Architecture',
                desc: 'We can\'t read your emails even if we wanted to. Your data is encrypted with keys only you control.',
              },
              {
                icon: <Server className="h-8 w-8" />,
                title: 'Data Residency',
                desc: 'Choose where your data lives. US, EU, or Asia-Pacific data centers with full sovereignty.',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="border-gradient before:rounded-2xl bg-white/5 rounded-2xl p-6 backdrop-blur [animation:fadeSlideIn_0.5s_ease-in-out_0.2s_both] animate-on-scroll"
                style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
              >
                <div className="text-emerald-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="z-10 mt-24 py-12 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 [animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both] animate-on-scroll">
            <h2 className="text-4xl font-bold text-white mb-4">Compliance & Certifications</h2>
            <p className="text-lg text-white/70 max-w-2xl">
              Meet regulatory requirements with certifications and controls your auditors trust.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: <FileCheck className="h-10 w-10" />,
                title: 'GDPR Compliance',
                desc: 'Full General Data Protection Regulation compliance with data export, deletion, and privacy controls built in.',
                features: ['Right to access', 'Right to deletion', 'Data portability', 'Privacy by design'],
              },
              {
                icon: <FileCheck className="h-10 w-10" />,
                title: 'CCPA Compliance',
                desc: 'California Consumer Privacy Act compliance. Transparent data practices and user control.',
                features: ['Data disclosure', 'Opt-out rights', 'Non-discrimination', 'Access requests'],
              },
              {
                icon: <Shield className="h-10 w-10" />,
                title: 'SOC 2 Type II',
                desc: 'Independent audit of security controls (in progress). Annual security assessments.',
                features: ['Security controls', 'Availability', 'Confidentiality', 'Privacy'],
              },
              {
                icon: <Shield className="h-10 w-10" />,
                title: 'ISO 27001',
                desc: 'Information security management system certification (planned for Q2 2025).',
                features: ['Risk assessment', 'Security policies', 'Incident response', 'Continuous improvement'],
              },
            ].map((cert, idx) => (
              <div
                key={idx}
                className="border-gradient before:rounded-2xl bg-white/5 rounded-2xl p-8 backdrop-blur [animation:fadeSlideIn_0.5s_ease-in-out_0.2s_both] animate-on-scroll"
                style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
              >
                <div className="text-emerald-400 mb-4">{cert.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-3">{cert.title}</h3>
                <p className="text-white/60 mb-4">{cert.desc}</p>
                <ul className="space-y-2">
                  {cert.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Privacy */}
      <section className="z-10 mt-24 py-12 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="border-gradient before:rounded-2xl bg-white/5 rounded-2xl p-12 backdrop-blur [animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both] animate-on-scroll">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold text-white mb-6">Our Privacy Promise</h2>
              
              <div className="space-y-6 text-white/70">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">What We DON'T Do</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">✗</span>
                      <span>We <strong className="text-white">never scan</strong> your emails for advertising</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">✗</span>
                      <span>We <strong className="text-white">never sell</strong> your data to third parties</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">✗</span>
                      <span>We <strong className="text-white">never train AI models</strong> on your email content</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">What We DO</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">✓</span>
                      <span>Encrypt everything with keys you control</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">✓</span>
                      <span>Give you full data export and deletion tools</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">✓</span>
                      <span>Process data only to provide the service you requested</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">✓</span>
                      <span>Be transparent about what we collect and why</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Incident Response */}
      <section className="z-10 mt-24 py-12 relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 [animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both] animate-on-scroll">
            <h2 className="text-4xl font-bold text-white mb-4">24/7 Security Monitoring</h2>
            <p className="text-lg text-white/70 max-w-2xl">
              Continuous protection with rapid response to any security concerns.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-gradient before:rounded-2xl bg-white/5 rounded-2xl p-8 backdrop-blur [animation:fadeSlideIn_0.5s_ease-in-out_0.2s_both] animate-on-scroll">
              <AlertCircle className="h-10 w-10 text-[#FF4C5A] mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Incident Response</h3>
              <ul className="space-y-3 text-white/60">
                <li>• 24/7 security operations center</li>
                <li>• <span className="text-white font-semibold">&lt;15 minute</span> initial response time</li>
                <li>• Automated threat detection and blocking</li>
                <li>• Regular security audits and penetration testing</li>
              </ul>
            </div>

            <div className="border-gradient before:rounded-2xl bg-white/5 rounded-2xl p-8 backdrop-blur [animation:fadeSlideIn_0.5s_ease-in-out_0.3s_both] animate-on-scroll">
              <Shield className="h-10 w-10 text-emerald-400 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">Vulnerability Disclosure</h3>
              <p className="text-white/60 mb-4">
                Found a security issue? We welcome responsible disclosure and respond rapidly to all reports.
              </p>
              <a
                href="mailto:security@easemail.com"
                className="inline-flex items-center gap-2 text-[#FF4C5A] hover:text-[#FF4C5A]/80 font-semibold"
              >
                security@easemail.com
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

