'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface IMAPProvider {
  name: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
}

const commonProviders: IMAPProvider[] = [
  {
    name: 'Fastmail',
    imapHost: 'imap.fastmail.com',
    imapPort: 993,
    smtpHost: 'smtp.fastmail.com',
    smtpPort: 465,
  },
  {
    name: 'Gmail (IMAP)',
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
  },
  {
    name: 'Outlook/Hotmail',
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
  },
  {
    name: 'Yahoo',
    imapHost: 'imap.mail.yahoo.com',
    imapPort: 993,
    smtpHost: 'smtp.mail.yahoo.com',
    smtpPort: 465,
  },
  {
    name: 'iCloud',
    imapHost: 'imap.mail.me.com',
    imapPort: 993,
    smtpHost: 'smtp.mail.me.com',
    smtpPort: 587,
  },
];

export function IMAPConnectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('custom');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    imapHost: '',
    imapPort: 993,
    smtpHost: '',
    smtpPort: 465,
  });

  const handleProviderChange = (providerName: string) => {
    setSelectedProvider(providerName);
    if (providerName === 'custom') {
      setFormData((prev) => ({
        ...prev,
        imapHost: '',
        imapPort: 993,
        smtpHost: '',
        smtpPort: 465,
      }));
    } else {
      const provider = commonProviders.find((p) => p.name === providerName);
      if (provider) {
        setFormData((prev) => ({
          ...prev,
          imapHost: provider.imapHost,
          imapPort: provider.imapPort,
          smtpHost: provider.smtpHost,
          smtpPort: provider.smtpPort,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/aurinko/imap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect IMAP account');
      }

      console.log('✅ IMAP account connected:', data);
      router.push('/dashboard?success=email_connected');
    } catch (err) {
      console.error('❌ IMAP connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="provider">Email Provider</Label>
        <select
          id="provider"
          value={selectedProvider}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        >
          <option value="custom">Custom (Manual Setup)</option>
          {commonProviders.map((provider) => (
            <option key={provider.name} value={provider.name}>
              {provider.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          required
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          placeholder="[email protected]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password / App Password</Label>
        <Input
          id="password"
          type="password"
          required
          value={formData.password}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, password: e.target.value }))
          }
          placeholder="Your email password"
        />
        <p className="text-xs text-muted-foreground">
          For Gmail, use an App Password. For other providers, use your regular
          password.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="imapHost">IMAP Host</Label>
          <Input
            id="imapHost"
            required
            value={formData.imapHost}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, imapHost: e.target.value }))
            }
            placeholder="imap.example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imapPort">IMAP Port</Label>
          <Input
            id="imapPort"
            type="number"
            required
            value={formData.imapPort}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                imapPort: parseInt(e.target.value),
              }))
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="smtpHost">SMTP Host</Label>
          <Input
            id="smtpHost"
            required
            value={formData.smtpHost}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, smtpHost: e.target.value }))
            }
            placeholder="smtp.example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="smtpPort">SMTP Port</Label>
          <Input
            id="smtpPort"
            type="number"
            required
            value={formData.smtpPort}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                smtpPort: parseInt(e.target.value),
              }))
            }
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          'Connect IMAP Account'
        )}
      </Button>
    </form>
  );
}
