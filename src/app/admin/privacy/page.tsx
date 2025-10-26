import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DataExportRequests } from '@/components/admin/privacy/DataExportRequests';
import { DeletionRequests } from '@/components/admin/privacy/DeletionRequests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileDown, Trash2, Shield } from 'lucide-react';

export const metadata = {
  title: 'GDPR & Data Privacy - Admin',
  description: 'Manage data export and deletion requests',
};

async function PrivacyContent(): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Mock data for demonstration
  // In production, fetch from database
  const exportRequests = [];
  const deletionRequests = [];

  return (
    <Tabs defaultValue="export" className="space-y-6">
      <TabsList>
        <TabsTrigger value="export" className="flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          Data Export Requests
        </TabsTrigger>
        <TabsTrigger value="deletion" className="flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          Deletion Requests
        </TabsTrigger>
      </TabsList>

      <TabsContent value="export" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5" />
              GDPR Data Export Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataExportRequests initialRequests={exportRequests} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              About Data Exports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>GDPR Article 15:</strong> Users have the right to access
              their personal data.
            </p>
            <p>
              Exports include: profile, settings, emails, contacts, audit logs,
              support tickets, orders, and subscriptions.
            </p>
            <p>
              Data is provided in JSON format within a ZIP archive. Sensitive
              tokens are redacted.
            </p>
            <p>
              <strong>Processing Time:</strong> Most exports complete within 1
              hour. Large accounts may take longer.
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="deletion" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Data Deletion Requests (Right to be Forgotten)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DeletionRequests initialRequests={deletionRequests} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              About Data Deletion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>GDPR Article 17:</strong> Users have the right to be
              forgotten.
            </p>
            <p>
              <strong>Grace Period:</strong> 30 days from request date. Users
              can cancel during this time.
            </p>
            <p>
              <strong>What Gets Deleted:</strong> All user data including
              emails, attachments, contacts, settings, orders, and
              subscriptions.
            </p>
            <p>
              <strong>What Gets Anonymized:</strong> Audit logs are anonymized
              (not deleted) for compliance purposes.
            </p>
            <p className="text-destructive font-medium">
              ⚠️ Deletion is permanent and cannot be undone after the grace
              period.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export default async function PrivacyPage(): Promise<JSX.Element> {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">GDPR & Data Privacy</h1>
        <p className="text-muted-foreground">
          Manage data export and deletion requests in compliance with GDPR
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <PrivacyContent />
      </Suspense>
    </div>
  );
}
