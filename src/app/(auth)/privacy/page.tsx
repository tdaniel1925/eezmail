import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy - easeMail',
  description: 'easeMail Privacy Policy and Data Protection',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              easeMail (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our email
              management service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Information We Collect
            </h2>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              2.1 Information You Provide
            </h3>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-2">
              <li>Account information (name, email address, password)</li>
              <li>Email account credentials (securely stored)</li>
              <li>Payment information (processed by Stripe or Square)</li>
              <li>Profile settings and preferences</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
              2.2 Information Collected Automatically
            </h3>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-2">
              <li>Email content and metadata (for AI processing and organization)</li>
              <li>Usage data and analytics</li>
              <li>Device information and IP address</li>
              <li>Cookies and tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We use your information to:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-2">
              <li>Provide, maintain, and improve our email management services</li>
              <li>Process your emails using AI for categorization and insights</li>
              <li>Send you service-related notifications and updates</li>
              <li>Process payments and manage subscriptions</li>
              <li>Respond to your support requests</li>
              <li>Analyze usage patterns to improve our service</li>
              <li>Detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              4. Email Data Processing
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We take your email privacy seriously:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-2">
              <li>
                <strong>AI Processing:</strong> Your emails are processed using AI to provide categorization,
                summarization, and insights
              </li>
              <li>
                <strong>No Human Access:</strong> Our team does not read your emails unless you explicitly request
                support
              </li>
              <li>
                <strong>Encryption:</strong> All email data is encrypted in transit and at rest
              </li>
              <li>
                <strong>No Third-Party Sharing:</strong> We do not sell or share your email content with third
                parties
              </li>
              <li>
                <strong>AI Training:</strong> We do not use your email content to train AI models without your
                explicit consent
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              5. Data Sharing and Disclosure
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-2">
              <li>
                <strong>Service Providers:</strong> With trusted third parties who help us operate our service
                (e.g., Supabase, OpenAI)
              </li>
              <li>
                <strong>Payment Processors:</strong> With Stripe or Square to process payments
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to protect our rights
              </li>
              <li>
                <strong>Business Transfers:</strong> In the event of a merger, acquisition, or asset sale
              </li>
              <li>
                <strong>With Your Consent:</strong> When you explicitly authorize us to share your information
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              6. Data Security
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-2">
              <li>End-to-end encryption for data transmission</li>
              <li>Encrypted database storage</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
              <li>Secure OAuth 2.0 for email account connections</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              7. Your Rights and Choices
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-2">
              <li>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Correction:</strong> Update or correct your information
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and data
              </li>
              <li>
                <strong>Export:</strong> Download your data in a portable format
              </li>
              <li>
                <strong>Opt-Out:</strong> Unsubscribe from marketing communications
              </li>
              <li>
                <strong>Revoke Access:</strong> Disconnect your email accounts at any time
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              8. Data Retention
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We retain your data for as long as your account is active or as needed to provide our services. When
              you delete your account, we will delete your data within 30 days, except where we are required to
              retain it for legal purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              9. Children&apos;s Privacy
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Our Service is not intended for users under the age of 18. We do not knowingly collect personal
              information from children. If you believe we have collected information from a child, please contact
              us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              10. International Data Transfers
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your information may be transferred to and processed in countries other than your own. We ensure that
              appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              11. Changes to This Policy
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by
              email or through a prominent notice on our Service. Your continued use after changes indicates
              acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              12. Contact Us
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Email:{' '}
              <a href="mailto:privacy@easemail.ai" className="text-primary hover:underline">
                privacy@easemail.ai
              </a>
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Support:{' '}
              <a href="mailto:support@easemail.ai" className="text-primary hover:underline">
                support@easemail.ai
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

