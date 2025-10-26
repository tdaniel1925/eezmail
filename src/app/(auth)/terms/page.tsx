import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service - easeMail',
  description: 'easeMail Terms of Service and User Agreement',
};

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              By accessing and using easeMail (&quot;the Service&quot;), you agree to be bound by these Terms of Service
              (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Description of Service
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              easeMail is an AI-powered email management platform that helps users organize, prioritize, and manage
              their email communications efficiently. The Service includes email synchronization, AI-powered
              categorization, and productivity features.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              3. User Accounts
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Ensuring your account information is accurate and up-to-date</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              4. Privacy and Data Protection
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your privacy is important to us. Our{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{' '}
              explains how we collect, use, and protect your data. By using the Service, you consent to our data
              practices as described in the Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              5. Acceptable Use
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-2">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Violate any laws in your jurisdiction</li>
              <li>Infringe on the intellectual property rights of others</li>
              <li>Transmit any malicious code or viruses</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Use the Service to send spam or unsolicited communications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              6. Billing and Payment
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              For paid subscriptions:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-2">
              <li>You agree to pay all fees associated with your chosen plan</li>
              <li>Payments are processed through Stripe or Square</li>
              <li>Subscriptions auto-renew unless cancelled</li>
              <li>Refunds are provided in accordance with our refund policy</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              7. Intellectual Property
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              The Service and its original content, features, and functionality are owned by easeMail and are
              protected by international copyright, trademark, patent, trade secret, and other intellectual property
              laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              8. Limitation of Liability
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              To the maximum extent permitted by law, easeMail shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages resulting from your use or inability to use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              9. Changes to Terms
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes
              via email or through the Service. Your continued use of the Service after changes constitutes
              acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              10. Termination
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We may terminate or suspend your account and access to the Service immediately, without prior notice,
              for any violation of these Terms or for any other reason at our sole discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              11. Contact Us
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Email:{' '}
              <a href="mailto:support@easemail.app" className="text-primary hover:underline">
                support@easemail.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

