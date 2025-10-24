'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/lib/toast';
import { IMAP_PROVIDERS } from '@/lib/email/imap-providers';

function IMAPSetupPageContent(): JSX.Element {
  const searchParams = useSearchParams();
  const provider = searchParams.get('provider') || 'imap';
  const userId = searchParams.get('userId');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    // IMAP fields (for receiving)
    host: '',
    port: 993,
    secure: true,
    provider: provider,
    // SMTP fields (for sending)
    smtpHost: '',
    smtpPort: 465,
    smtpSecure: true,
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'testing' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleProviderChange = (selectedProvider: string) => {
    const providerConfig =
      IMAP_PROVIDERS[selectedProvider as keyof typeof IMAP_PROVIDERS];
    if (providerConfig) {
      // Derive SMTP host from IMAP host (replace "imap." with "smtp.")
      const smtpHost = providerConfig.host.replace('imap.', 'smtp.');

      setFormData((prev) => ({
        ...prev,
        provider: selectedProvider,
        host: providerConfig.host,
        port: providerConfig.port,
        secure: providerConfig.secure,
        // Auto-fill SMTP settings
        smtpHost: smtpHost,
        smtpPort: 465, // Standard SMTP SSL port
        smtpSecure: true,
      }));
    }
  };

  const handleTestConnection = async () => {
    setIsConnecting(true);
    setConnectionStatus('testing');
    setErrorMessage('');

    try {
      // Add timeout to fetch request (35 seconds to allow server 30s timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const response = await fetch('/api/email/imap/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (result.success) {
        setConnectionStatus('success');
        toast.success('IMAP connection successful!');
      } else {
        setConnectionStatus('error');
        setErrorMessage(result.error || 'Connection failed');
        toast.error(result.error || 'Connection failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      if (error instanceof Error && error.name === 'AbortError') {
        setErrorMessage('Connection timed out after 35 seconds');
        toast.error(
          'Connection timed out - check your credentials and server settings'
        );
      } else {
        setErrorMessage('Network error occurred');
        toast.error('Network error occurred');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSaveAccount = async () => {
    if (connectionStatus !== 'success') {
      toast.error('Please test the connection first');
      return;
    }

    try {
      setIsConnecting(true);

      // Step 1: Save the account
      const response = await fetch('/api/email/imap/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const accountId = result.accountId;

        toast.success('✅ Account saved successfully!');

        // Step 2: Trigger initial email sync
        toast.info('📥 Starting email sync...');

        try {
          const syncResponse = await fetch('/api/email/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              accountId,
              initialSync: true,
            }),
          });

          const syncResult = await syncResponse.json();

          if (syncResult.success) {
            toast.success('🎉 Email sync started! Loading your emails...');
          } else {
            toast.warning(
              'Account saved, but sync failed to start. Try refreshing.'
            );
          }
        } catch (syncError) {
          console.error('Sync error:', syncError);
          toast.warning(
            'Account saved, but sync failed to start. Try refreshing.'
          );
        }

        // Redirect after a brief delay to show messages
        setTimeout(() => {
          window.location.href = '/dashboard/inbox';
        }, 2000);
      } else {
        toast.error(result.error || 'Failed to save account');
      }
    } catch (err) {
      console.error('Error saving account:', err);
      toast.error('Failed to save account');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50/50 dark:bg-black/50">
      <div className="mx-auto max-w-2xl p-8 pb-24">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/settings?tab=email-accounts"
            className="mb-6 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors group"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back to Email Accounts
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-600 text-white">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                IMAP Email Setup
              </h1>
              <p className="text-sm text-gray-600 dark:text-white/60">
                Connect any email account using IMAP
              </p>
            </div>
          </div>
        </div>

        {/* Setup Form */}
        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-6">
          <div className="space-y-6">
            {/* Provider Selection */}
            <div>
              <Label
                htmlFor="provider"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-white"
              >
                Email Provider
              </Label>
              <Select
                value={formData.provider}
                onValueChange={handleProviderChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your email provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Outlook">Microsoft Outlook</SelectItem>
                  <SelectItem value="GGmail">Gmail</SelectItem>
                  <SelectItem value="Yahoo">Yahoo Mail</SelectItem>
                  <SelectItem value="icloud">iCloud Mail</SelectItem>
                  <SelectItem value="Fastmail">Fastmail</SelectItem>
                  <SelectItem value="Custom">Custom IMAP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email Address */}
            <div>
              <Label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-white"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="your-email@example.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <Label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-white"
              >
                App Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Enter your app password"
                required
              />
              <p className="mt-1 text-xs text-gray-600 dark:text-white/60">
                Use an app password, not your regular email password
              </p>
            </div>

            {/* IMAP Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="host"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-white"
                >
                  IMAP Host
                </Label>
                <Input
                  id="host"
                  value={formData.host}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, host: e.target.value }))
                  }
                  placeholder="imap.example.com"
                  required
                />
              </div>
              <div>
                <Label
                  htmlFor="port"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-white"
                >
                  Port
                </Label>
                <Input
                  id="port"
                  type="number"
                  value={formData.port}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      port: parseInt(e.target.value),
                    }))
                  }
                  placeholder="993"
                  required
                />
              </div>
            </div>

            {/* SMTP Settings Section */}
            <div className="border-t border-gray-200 dark:border-white/10 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                SMTP Settings (For Sending Emails)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={formData.smtpHost}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        smtpHost: e.target.value,
                      }))
                    }
                    placeholder="smtp.fastmail.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={formData.smtpPort}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        smtpPort: parseInt(e.target.value),
                      }))
                    }
                    placeholder="465"
                    required
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-600 dark:text-white/60">
                SMTP uses the same email and password as IMAP. Port 465 (SSL) or
                587 (TLS) recommended.
              </p>
            </div>

            {/* Connection Status */}
            {connectionStatus !== 'idle' && (
              <div className="rounded-lg border p-4">
                {connectionStatus === 'testing' && (
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                    <span>
                      Testing connection (this may take up to 30 seconds)...
                    </span>
                  </div>
                )}
                {connectionStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>Connection successful!</span>
                  </div>
                )}
                {connectionStatus === 'error' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errorMessage}</span>
                    </div>
                    {errorMessage.includes('Timed out') && (
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <p className="font-medium mb-1">Possible causes:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>
                            Wrong password - make sure you&apos;re using an{' '}
                            <strong>app password</strong>, not your regular
                            password
                          </li>
                          <li>IMAP not enabled in your email settings</li>
                          <li>Firewall blocking port {formData.port}</li>
                          <li>Incorrect IMAP server settings</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleTestConnection}
                disabled={
                  isConnecting ||
                  !formData.email ||
                  !formData.password ||
                  !formData.host ||
                  !formData.smtpHost
                }
                isLoading={isConnecting}
              >
                Test Connection
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveAccount}
                disabled={connectionStatus !== 'success'}
              >
                Save Account
              </Button>
            </div>
          </div>
        </div>

        {/* Help Information */}
        <div className="mt-6 rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Need Help Setting Up IMAP?
          </h4>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Enable IMAP in your email settings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Generate an app password (not your regular password)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>
                Use the correct IMAP server settings for your provider
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Wrapper component with Suspense boundary
export default function IMAPSetupPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <IMAPSetupPageContent />
    </Suspense>
  );
}
