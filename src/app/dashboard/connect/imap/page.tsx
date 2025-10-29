import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { IMAPConnectForm } from '@/components/email/IMAPConnectForm';

export default async function IMAPConnectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Connect IMAP Account</h1>
        <p className="mt-2 text-muted-foreground">
          Connect your email account using IMAP. This works with most email
          providers including Gmail, Outlook, Yahoo, Fastmail, and custom IMAP
          servers.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <IMAPConnectForm />
      </div>

      <div className="mt-8 space-y-4 text-sm text-muted-foreground">
        <div>
          <h3 className="font-semibold text-foreground">📧 Gmail Users</h3>
          <p>
            Gmail requires an App Password. Enable 2-Step Verification, then
            generate an App Password at:{' '}
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              myaccount.google.com/apppasswords
            </a>
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-foreground">🔒 Security</h3>
          <p>
            Your credentials are securely stored and encrypted. We use Aurinko's
            secure infrastructure to manage your IMAP connections.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-foreground">
            ⚙️ Common IMAP Ports
          </h3>
          <ul className="list-inside list-disc space-y-1">
            <li>IMAP (SSL/TLS): Port 993</li>
            <li>SMTP (SSL): Port 465</li>
            <li>SMTP (TLS/STARTTLS): Port 587</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
