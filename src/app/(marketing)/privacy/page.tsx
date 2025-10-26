/**
 * Privacy Policy Page
 * Privacy practices and data protection
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Shield, Lock, Eye, Download, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
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
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Privacy Policy
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
          <p className="text-lg text-gray-700">
            Your privacy is critically important to us. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your
            information.
          </p>
        </div>

        <div className="space-y-6">
          {/* Data Collection */}
          <Card>
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Information We Collect</h2>
              </div>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none pt-6">
              <h3>Account Information</h3>
              <p>When you create an account, we collect:</p>
              <ul>
                <li>Email address</li>
                <li>Full name</li>
                <li>Password (encrypted)</li>
                <li>Profile information (optional)</li>
              </ul>

              <h3>Email Data</h3>
              <p>When you connect your email accounts, we collect:</p>
              <ul>
                <li>Email content and metadata</li>
                <li>Sender and recipient information</li>
                <li>Attachments and files</li>
                <li>Email timestamps and folders</li>
                <li>Email provider credentials (encrypted)</li>
              </ul>

              <h3>Usage Information</h3>
              <p>We automatically collect:</p>
              <ul>
                <li>Device information and IP address</li>
                <li>Browser type and version</li>
                <li>Pages visited and features used</li>
                <li>Time and date of visits</li>
                <li>Error logs and performance data</li>
              </ul>

              <h3>AI Processing Data</h3>
              <p>When you use AI features, we process:</p>
              <ul>
                <li>Email content for classification and suggestions</li>
                <li>Writing patterns for composition assistance</li>
                <li>User preferences and feedback</li>
              </ul>
            </CardContent>
          </Card>

          {/* How We Use Data */}
          <Card>
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">
                  How We Use Your Information
                </h2>
              </div>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none pt-6">
              <p>We use your information to:</p>
              <ul>
                <li>
                  <strong>Provide the Service:</strong> Sync, display, and
                  manage your emails
                </li>
                <li>
                  <strong>AI Features:</strong> Classify emails, suggest
                  replies, and automate tasks
                </li>
                <li>
                  <strong>Security:</strong> Detect phishing, spam, and security
                  threats
                </li>
                <li>
                  <strong>Improvements:</strong> Analyze usage to improve
                  features and performance
                </li>
                <li>
                  <strong>Communications:</strong> Send service updates and
                  important notices
                </li>
                <li>
                  <strong>Support:</strong> Respond to your questions and issues
                </li>
                <li>
                  <strong>Legal Compliance:</strong> Meet legal obligations and
                  prevent fraud
                </li>
              </ul>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
                <p className="text-sm font-medium text-blue-900 m-0">
                  <strong>Important:</strong> We NEVER read your emails for
                  marketing purposes or sell your data to third parties.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card>
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">How We Protect Your Data</h2>
              </div>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none pt-6">
              <h3>Encryption</h3>
              <ul>
                <li>All data is encrypted in transit (TLS/SSL)</li>
                <li>Passwords are hashed using industry-standard algorithms</li>
                <li>Email provider credentials are encrypted at rest</li>
                <li>Database encryption for sensitive information</li>
              </ul>

              <h3>Access Controls</h3>
              <ul>
                <li>Role-based access control for internal systems</li>
                <li>Multi-factor authentication available</li>
                <li>Regular security audits and penetration testing</li>
                <li>Limited employee access to user data</li>
              </ul>

              <h3>Infrastructure Security</h3>
              <ul>
                <li>Secure cloud hosting with top-tier providers</li>
                <li>Regular backups and disaster recovery plans</li>
                <li>24/7 security monitoring and incident response</li>
                <li>Compliance with industry security standards</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card>
            <CardHeader className="border-b bg-gray-50">
              <h2 className="text-2xl font-bold">
                When We Share Your Information
              </h2>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none pt-6">
              <p>We may share your information only in these circumstances:</p>

              <h3>Service Providers</h3>
              <p>
                We work with trusted third-party service providers who help us
                operate the Service:
              </p>
              <ul>
                <li>Cloud hosting providers (AWS, Google Cloud, etc.)</li>
                <li>Email delivery services</li>
                <li>AI/ML processing services (OpenAI, Anthropic)</li>
                <li>Payment processors (Stripe, Square)</li>
                <li>Analytics and monitoring tools</li>
              </ul>
              <p>
                All service providers are bound by strict confidentiality
                agreements.
              </p>

              <h3>Legal Requirements</h3>
              <p>We may disclose information if required by law, such as:</p>
              <ul>
                <li>Court orders or subpoenas</li>
                <li>Law enforcement requests</li>
                <li>Protection of our legal rights</li>
                <li>Prevention of fraud or security threats</li>
              </ul>

              <h3>Business Transfers</h3>
              <p>
                If we are involved in a merger, acquisition, or sale of assets,
                your information may be transferred. We will notify you before
                your data becomes subject to a different privacy policy.
              </p>
            </CardContent>
          </Card>

          {/* Your Rights (GDPR) */}
          <Card>
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Your Privacy Rights</h2>
              </div>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none pt-6">
              <p>
                Under GDPR and other privacy laws, you have the following
                rights:
              </p>

              <div className="space-y-4 not-prose">
                <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                  <Download className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Right to Access (Art. 15)
                    </h4>
                    <p className="text-sm text-gray-700">
                      Request a copy of all personal data we hold about you
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                  <Trash2 className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Right to Erasure (Art. 17)
                    </h4>
                    <p className="text-sm text-gray-700">
                      Request deletion of your personal data with a 30-day grace
                      period
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                  <Shield className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Right to Rectification
                    </h4>
                    <p className="text-sm text-gray-700">
                      Correct inaccurate or incomplete personal data
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                  <Lock className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Right to Restrict Processing
                    </h4>
                    <p className="text-sm text-gray-700">
                      Limit how we process your personal data
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-4">
                To exercise any of these rights, please contact us at{' '}
                <a href="mailto:privacy@example.com">privacy@example.com</a> or
                use the settings in your account dashboard.
              </p>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader className="border-b bg-gray-50">
              <h2 className="text-2xl font-bold">Data Retention</h2>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none pt-6">
              <p>
                We retain your information for as long as necessary to provide
                the Service:
              </p>
              <ul>
                <li>
                  <strong>Active accounts:</strong> Data retained while account
                  is active
                </li>
                <li>
                  <strong>Deleted accounts:</strong> Data deleted within 30 days
                  of account deletion
                </li>
                <li>
                  <strong>Backups:</strong> Backups retained for up to 90 days
                </li>
                <li>
                  <strong>Legal requirements:</strong> Some data may be retained
                  longer if required by law
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader className="border-b bg-gray-50">
              <h2 className="text-2xl font-bold">Children's Privacy</h2>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none pt-6">
              <p>
                Our Service is not intended for children under 13 years of age.
                We do not knowingly collect personal information from children
                under 13. If you are a parent or guardian and believe your child
                has provided us with personal information, please contact us
                immediately.
              </p>
            </CardContent>
          </Card>

          {/* International Transfers */}
          <Card>
            <CardHeader className="border-b bg-gray-50">
              <h2 className="text-2xl font-bold">
                International Data Transfers
              </h2>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none pt-6">
              <p>
                Your information may be transferred to and processed in
                countries other than your country of residence. These countries
                may have data protection laws different from your jurisdiction.
              </p>
              <p>
                We ensure appropriate safeguards are in place for international
                transfers, including Standard Contractual Clauses approved by
                the European Commission.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card>
            <CardHeader className="border-b bg-gray-50">
              <h2 className="text-2xl font-bold">
                Changes to This Privacy Policy
              </h2>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none pt-6">
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of any material changes by:
              </p>
              <ul>
                <li>Email notification</li>
                <li>Prominent notice in the Service</li>
                <li>Updating the "Last Updated" date at the top</li>
              </ul>
              <p>
                Your continued use of the Service after changes constitutes
                acceptance of the updated policy.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader className="border-b bg-gray-50">
              <h2 className="text-2xl font-bold">Contact Us</h2>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none pt-6">
              <p>
                If you have any questions about this Privacy Policy or our
                privacy practices, please contact us:
              </p>
              <ul>
                <li>
                  <strong>Privacy Team:</strong> privacy@example.com
                </li>
                <li>
                  <strong>General Support:</strong> support@example.com
                </li>
                <li>
                  <strong>Data Protection Officer:</strong> dpo@example.com
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
