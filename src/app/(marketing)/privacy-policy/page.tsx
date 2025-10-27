import Link from 'next/link';
import { Shield, Lock, Eye, Database, UserCheck, Globe } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy - Imbox AI Email Client',
  description:
    'Learn how Imbox protects your privacy and handles your data securely.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-black dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-white/10 bg-white/60 dark:bg-black/60 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              Imbox
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-gray-200 dark:border-white/10 bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-6">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Your privacy is our priority. Learn how we protect your data and respect your rights.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Key Principles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-white/10 p-6 text-center">
              <Lock className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Bank-Level Encryption
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All data encrypted in transit and at rest using AES-256
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-white/10 p-6 text-center">
              <Eye className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                No Training on Your Data
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your emails are never used to train AI models
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-white/10 p-6 text-center">
              <UserCheck className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                You Control Your Data
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Export or delete your data anytime
              </p>
            </div>
          </div>

          {/* Policy Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            {/* Section 1 */}
            <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-white/10 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <Database className="h-6 w-6 text-primary" />
                1. Information We Collect
              </h2>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                1.1 Account Information
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                When you create an account, we collect:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Email address</li>
                <li>Full name</li>
                <li>Password (hashed and encrypted)</li>
                <li>Profile picture (optional)</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                1.2 Email Data
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                To provide our email management services, we access and store:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Email content (messages, attachments, metadata)</li>
                <li>Contact information from your emails</li>
                <li>Email account credentials (OAuth tokens or app-specific passwords, encrypted)</li>
                <li>Email organization preferences and rules</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                1.3 Usage Data
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We collect data about how you use Imbox:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Feature usage and interactions</li>
                <li>Performance metrics and error logs</li>
                <li>Device and browser information</li>
                <li>IP address and approximate location</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-white/10 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <Globe className="h-6 w-6 text-primary" />
                2. How We Use Your Information
              </h2>
              
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use your information to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Provide our services:</strong> Sync emails, enable AI features, organize your inbox</li>
                <li><strong>Improve functionality:</strong> Develop new features, fix bugs, optimize performance</li>
                <li><strong>Communicate with you:</strong> Send service updates, respond to support requests</li>
                <li><strong>Ensure security:</strong> Detect and prevent fraud, protect against security threats</li>
                <li><strong>Comply with legal obligations:</strong> Respond to lawful requests, enforce our terms</li>
              </ul>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>Important:</strong> We do NOT sell your data to third parties. We do NOT use your emails to train AI models. We do NOT read your emails except when necessary for technical support (with your explicit permission).
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-white/10 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <Lock className="h-6 w-6 text-primary" />
                3. How We Protect Your Data
              </h2>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                3.1 Encryption
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>All data encrypted in transit using TLS 1.3</li>
                <li>All data encrypted at rest using AES-256</li>
                <li>OAuth credentials stored securely with Supabase Auth</li>
                <li>App passwords encrypted before database storage</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                3.2 Access Controls
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Multi-factor authentication available</li>
                <li>Row-level security (RLS) on database</li>
                <li>Principle of least privilege for employee access</li>
                <li>Regular security audits and penetration testing</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                3.3 Infrastructure
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Hosted on secure cloud infrastructure (Vercel, Supabase)</li>
                <li>Regular backups with encryption</li>
                <li>DDoS protection and firewall</li>
                <li>SOC 2 compliant infrastructure partners</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-white/10 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <UserCheck className="h-6 w-6 text-primary" />
                4. Your Rights (GDPR & CCPA)
              </h2>
              
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You have the following rights regarding your personal data:
              </p>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                4.1 Access & Portability
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Request a copy of your data in machine-readable format</li>
                <li>Export your emails at any time via Settings</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                4.2 Rectification
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Correct inaccurate personal data</li>
                <li>Update your account information anytime</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                4.3 Erasure (Right to be Forgotten)
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Delete your account and all associated data</li>
                <li>Request deletion of specific data</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                4.4 Restriction & Objection
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Restrict processing of your data</li>
                <li>Object to automated decision-making</li>
              </ul>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-6">
                <p className="text-sm text-green-900 dark:text-green-200">
                  To exercise any of these rights, go to <strong>Settings → Account → Privacy & Data</strong> or email us at <strong>privacy@imbox.app</strong>
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-white/10 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                5. AI Processing & Third-Party Services
              </h2>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                5.1 AI Features
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our AI features (email categorization, summaries, quick replies) process your email content to provide intelligent assistance. This processing:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Happens securely within our infrastructure or trusted AI providers (OpenAI)</li>
                <li>Is done in real-time and not stored beyond necessary caching</li>
                <li>Never uses your data to train AI models</li>
                <li>Can be disabled anytime in Settings</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                5.2 Third-Party Services
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use the following trusted service providers:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Supabase:</strong> Database and authentication</li>
                <li><strong>Vercel:</strong> Application hosting</li>
                <li><strong>OpenAI:</strong> AI processing (optional features)</li>
                <li><strong>Stripe/Square:</strong> Payment processing</li>
                <li><strong>Twilio:</strong> SMS and voice communications</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                All third-party services are carefully vetted and required to maintain equivalent security standards.
              </p>
            </section>

            {/* Section 6 */}
            <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-white/10 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                6. Cookies & Tracking
              </h2>
              
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use cookies and similar technologies for:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Essential cookies:</strong> Authentication, security, session management</li>
                <li><strong>Functional cookies:</strong> Remember your preferences and settings</li>
                <li><strong>Analytics cookies:</strong> Understand usage patterns (anonymized)</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                You can control cookie preferences in your browser settings. Note that disabling essential cookies may affect functionality.
              </p>
            </section>

            {/* Section 7 */}
            <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-white/10 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                7. Data Retention
              </h2>
              
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Account data:</strong> Retained until account deletion</li>
                <li><strong>Email data:</strong> Retained as long as you keep your account, or until you delete specific emails</li>
                <li><strong>Backup data:</strong> Retained for 90 days for disaster recovery</li>
                <li><strong>Logs and analytics:</strong> Retained for 12 months (anonymized after 90 days)</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                When you delete your account, all data is permanently removed within 30 days, except where we are legally required to retain it.
              </p>
            </section>

            {/* Section 8 */}
            <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-white/10 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                8. Children's Privacy
              </h2>
              
              <p className="text-gray-700 dark:text-gray-300">
                Imbox is not intended for users under 13 years of age (or 16 in the EU). We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us at <strong>privacy@imbox.app</strong> and we will delete it.
              </p>
            </section>

            {/* Section 9 */}
            <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-white/10 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                9. International Data Transfers
              </h2>
              
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Your data may be processed in countries outside your country of residence. We ensure adequate protection through:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                <li>Privacy Shield framework compliance (where applicable)</li>
                <li>Adequate security measures equivalent to GDPR standards</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-white/10 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                10. Changes to This Policy
              </h2>
              
              <p className="text-gray-700 dark:text-gray-300">
                We may update this privacy policy from time to time. We will notify you of significant changes via email or in-app notification. Continued use of Imbox after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* Contact */}
            <section className="bg-primary/5 rounded-lg border border-primary/20 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Contact Us
              </h2>
              
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have questions about this privacy policy or how we handle your data:
              </p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>Email:</strong> privacy@imbox.app</li>
                <li><strong>Support:</strong> support@imbox.app</li>
                <li><strong>Data Protection Officer:</strong> dpo@imbox.app</li>
              </ul>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-white/10 bg-white/60 dark:bg-black/60 backdrop-blur-md mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} Imbox. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/terms"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy-policy"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/dashboard/settings"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

