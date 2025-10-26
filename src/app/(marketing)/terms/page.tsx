/**
 * Terms and Conditions Page
 * Legal terms governing use of the service
 */

import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-primary hover:underline text-sm mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Terms and Conditions
              </h1>
              <p className="text-gray-600 mt-1">
                Last updated:{' '}
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="prose prose-gray max-w-none pt-6">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using this email management platform ("Service"),
              you accept and agree to be bound by the terms and provision of
              this agreement.
            </p>

            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily access the Service for
              personal or commercial use. This is the grant of a license, not a
              transfer of title, and under this license you may not:
            </p>
            <ul>
              <li>Modify or copy the materials</li>
              <li>
                Use the materials for any commercial purpose or for any public
                display
              </li>
              <li>
                Attempt to decompile or reverse engineer any software contained
                in the Service
              </li>
              <li>
                Remove any copyright or other proprietary notations from the
                materials
              </li>
              <li>
                Transfer the materials to another person or "mirror" the
                materials on any other server
              </li>
            </ul>

            <h2>3. Account Responsibilities</h2>
            <p>You are responsible for:</p>
            <ul>
              <li>
                Maintaining the confidentiality of your account and password
              </li>
              <li>Restricting access to your computer and account</li>
              <li>All activities that occur under your account or password</li>
            </ul>

            <h2>4. Email Account Integration</h2>
            <p>
              When you connect your email accounts to our Service, you grant us
              permission to access, store, and process your emails and related
              data for the purpose of providing the Service. We will:
            </p>
            <ul>
              <li>
                Access your email only as necessary to provide the Service
              </li>
              <li>Use industry-standard encryption to protect your data</li>
              <li>
                Never share your emails with third parties without consent
              </li>
              <li>Allow you to disconnect accounts at any time</li>
            </ul>

            <h2>5. AI Features and Data Processing</h2>
            <p>
              Our Service includes AI-powered features for email classification,
              composition assistance, and automation. By using these features,
              you acknowledge that:
            </p>
            <ul>
              <li>AI suggestions are automated and may require human review</li>
              <li>
                Email content may be processed by AI models to provide these
                features
              </li>
              <li>
                We implement safeguards to protect the confidentiality of your
                data
              </li>
              <li>You retain all ownership rights to your content and data</li>
            </ul>

            <h2>6. Billing and Subscriptions</h2>
            <p>If you choose to purchase a paid subscription:</p>
            <ul>
              <li>
                You will be billed automatically based on your chosen plan
              </li>
              <li>You can cancel your subscription at any time</li>
              <li>
                Refunds are provided according to our refund policy (contact
                support)
              </li>
              <li>Prices are subject to change with 30 days' notice</li>
            </ul>

            <h2>7. Acceptable Use Policy</h2>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>
                Send spam, unsolicited messages, or engage in illegal activities
              </li>
              <li>Harass, abuse, or harm others</li>
              <li>Impersonate any person or entity</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Interfere with the security or integrity of the Service</li>
            </ul>

            <h2>8. Service Availability</h2>
            <p>
              We strive to provide reliable Service, but we do not guarantee
              uninterrupted access. We reserve the right to:
            </p>
            <ul>
              <li>Perform maintenance that may temporarily limit access</li>
              <li>Modify or discontinue features with notice</li>
              <li>Suspend access for violations of these terms</li>
            </ul>

            <h2>9. Data Retention and Deletion</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Request a copy of your data at any time</li>
              <li>Delete your account and associated data</li>
              <li>Export your data in standard formats</li>
            </ul>
            <p>
              Upon account deletion, we will remove your data within 30 days,
              except where retention is required by law.
            </p>

            <h2>10. Intellectual Property</h2>
            <p>
              The Service and its original content (excluding your emails),
              features, and functionality are owned by us and are protected by
              international copyright, trademark, and other intellectual
              property laws.
            </p>

            <h2>11. Limitation of Liability</h2>
            <p>
              In no event shall we be liable for any damages (including, without
              limitation, damages for loss of data or profit, or due to business
              interruption) arising out of the use or inability to use the
              Service.
            </p>

            <h2>12. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without
              prior notice or liability, for any reason, including breach of
              these Terms. Upon termination, your right to use the Service will
              immediately cease.
            </p>

            <h2>13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will
              notify users of any material changes by email or through the
              Service. Continued use after such modifications constitutes
              acceptance of the updated terms.
            </p>

            <h2>14. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with
              the laws of the jurisdiction in which we operate, without regard
              to its conflict of law provisions.
            </p>

            <h2>15. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <ul>
              <li>Email: legal@example.com</li>
              <li>Support: support@example.com</li>
            </ul>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-8">
              <p className="text-sm font-medium text-blue-900">
                <strong>Important:</strong> By using our Service, you
                acknowledge that you have read, understood, and agree to be
                bound by these Terms and Conditions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
