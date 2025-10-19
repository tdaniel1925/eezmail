import Link from 'next/link';
import { Shield, Lock, Eye, Database, Server, FileCheck, Users, CheckCircle, Globe } from 'lucide-react';

export const metadata = {
  title: 'Security - easeMail | Enterprise-Grade Email Security',
  description:
    'SOC 2 Type II certified, GDPR compliant, with AES-256 encryption. Learn how easeMail protects your data with enterprise-grade security.',
};

export default function SecurityPage() {
  const certifications = [
    {
      icon: Shield,
      title: 'SOC 2 Type II',
      description: 'Audited annually for security, availability, and confidentiality',
    },
    {
      icon: FileCheck,
      title: 'GDPR Compliant',
      description: 'Full compliance with EU data protection regulations',
    },
    {
      icon: Globe,
      title: 'ISO 27001',
      description: 'International standard for information security management',
    },
    {
      icon: Lock,
      title: 'HIPAA Ready',
      description: 'Healthcare-compliant configurations available for enterprise',
    },
  ];

  const securityFeatures = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'All data encrypted in transit (TLS 1.3) and at rest (AES-256)',
      details: [
        'TLS 1.3 for data in transit',
        'AES-256 encryption at rest',
        'Zero-knowledge architecture option',
        'Encrypted backups',
      ],
    },
    {
      icon: Eye,
      title: 'Privacy First',
      description: 'We never train AI models on your emails or sell your data',
      details: [
        'No data selling, ever',
        'No AI training on private emails',
        'Data isolation per customer',
        'Right to be forgotten',
      ],
    },
    {
      icon: Database,
      title: 'Data Sovereignty',
      description: 'Choose where your data is stored with regional data centers',
      details: [
        'US, EU, and Asia data centers',
        'Custom data retention policies',
        'Data residency guarantees',
        'Local compliance adherence',
      ],
    },
    {
      icon: Server,
      title: 'Infrastructure Security',
      description: 'Built on enterprise-grade infrastructure with 99.9% uptime SLA',
      details: [
        'AWS/GCP secure infrastructure',
        'DDoS protection',
        'Regular security audits',
        'Incident response team',
      ],
    },
    {
      icon: Users,
      title: 'Access Control',
      description: 'Enterprise SSO, MFA, and granular permission management',
      details: [
        'SSO/SAML support',
        'Multi-factor authentication',
        'Role-based access control',
        'Session management',
      ],
    },
    {
      icon: FileCheck,
      title: 'Audit & Compliance',
      description: 'Comprehensive audit logs and compliance reporting',
      details: [
        'Complete audit trails',
        'Real-time monitoring',
        'Compliance reports',
        'Security event alerts',
      ],
    },
  ];

  const trustPillars = [
    {
      title: 'Transparent',
      description: 'Open about our security practices and incident response',
    },
    {
      title: 'Proactive',
      description: 'Regular penetration testing and security audits',
    },
    {
      title: 'Compliant',
      description: 'Meet global standards for data protection and privacy',
    },
    {
      title: 'Responsive',
      description: '24/7 security operations center monitoring threats',
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
              <Shield className="w-4 h-4" />
              Enterprise-Grade Security
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-white">
              Your Data Is{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF4C5A] to-white">
                Safe With Us
              </span>
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed mb-8">
              Bank-level security meets cutting-edge AI. easeMail is SOC 2 Type II certified and GDPR compliant, with
              enterprise-grade encryption and privacy controls.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF4C5A] text-white px-8 py-4 text-lg font-medium hover:bg-[#FF4C5A]/90 transition"
              >
                Start Secure Trial
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 text-white ring-1 ring-white/15 px-8 py-4 text-lg font-medium hover:bg-white/15 transition"
              >
                Talk to Security Team
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Certified & Compliant</h2>
            <p className="text-slate-400">Independently verified security and compliance</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <div
                key={index}
                className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-6 text-center hover:ring-white/20 transition"
              >
                <div className="w-16 h-16 rounded-full bg-[#FF4C5A]/10 ring-1 ring-[#FF4C5A]/20 flex items-center justify-center mx-auto mb-4">
                  <cert.icon className="w-8 h-8 text-[#FF4C5A]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{cert.title}</h3>
                <p className="text-sm text-slate-400">{cert.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Security Features</h2>
            <p className="text-slate-400">Comprehensive protection at every layer</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityFeatures.map((feature, index) => (
              <div
                key={index}
                className="rounded-2xl bg-slate-900/40 ring-1 ring-white/10 backdrop-blur-md p-8 hover:ring-white/20 transition"
              >
                <div className="w-12 h-12 rounded-full bg-[#FF4C5A]/10 ring-1 ring-[#FF4C5A]/20 flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-[#FF4C5A]" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                <p className="text-slate-400 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Pillars */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Built on Trust</h2>
            <p className="text-slate-400">Our commitment to your security</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustPillars.map((pillar, index) => (
              <div
                key={index}
                className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md p-6 text-center"
              >
                <h3 className="text-xl font-semibold mb-2 text-white">{pillar.title}</h3>
                <p className="text-sm text-slate-400">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Security */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <div className="rounded-3xl bg-slate-900/60 ring-1 ring-white/10 backdrop-blur-md overflow-hidden">
            <div className="p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Enterprise Security Add-Ons</h2>
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#FF4C5A]/10 ring-1 ring-[#FF4C5A]/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-[#FF4C5A]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 text-white">On-Premise Deployment</h3>
                    <p className="text-slate-400">
                      Deploy easeMail in your own data center with full control over infrastructure and data location.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#FF4C5A]/10 ring-1 ring-[#FF4C5A]/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-[#FF4C5A]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 text-white">Custom Data Retention</h3>
                    <p className="text-slate-400">
                      Configure retention policies to meet your compliance requirements, from 30 days to unlimited.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#FF4C5A]/10 ring-1 ring-[#FF4C5A]/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-[#FF4C5A]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 text-white">Advanced DLP</h3>
                    <p className="text-slate-400">
                      Data Loss Prevention with custom rules, content scanning, and automated remediation.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#FF4C5A]/10 ring-1 ring-[#FF4C5A]/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-5 h-5 text-[#FF4C5A]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1 text-white">Security Integrations</h3>
                    <p className="text-slate-400">
                      Integrate with your existing security stack: SIEM, MDM, threat intelligence platforms.
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF4C5A] text-white px-8 py-3 text-base font-semibold hover:bg-[#FF4C5A]/90 transition"
              >
                Contact Enterprise Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 md:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-[#FF4C5A]/20 to-transparent ring-1 ring-[#FF4C5A]/30 p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Questions About Security?</h2>
            <p className="text-xl text-slate-300 mb-8">
              Our security team is here to answer your questions and provide documentation
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-slate-900 px-8 py-4 text-lg font-semibold hover:bg-slate-100 transition"
              >
                Contact Security Team
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 text-white ring-1 ring-white/15 px-8 py-4 text-lg font-semibold hover:bg-white/15 transition"
              >
                Start Secure Trial
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
