'use client';

/**
 * GDPR & Data Privacy Page
 * Manage data export and deletion requests in compliance with GDPR
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileDown, Trash2, Shield } from 'lucide-react';
import { InlineNotification } from '@/components/ui/inline-notification';
import { DataExportRequestsTable } from '@/components/admin/privacy/DataExportRequestsTable';
import { DeletionRequestsTable } from '@/components/admin/privacy/DeletionRequestsTable';

export default function PrivacyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exportRequests, setExportRequests] = useState<any[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<any[]>([]);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      // Load export requests
      const exportResponse = await fetch('/api/admin/privacy/export');
      if (!exportResponse.ok) {
        if (exportResponse.status === 401) {
          router.push('/login');
          return;
        }
        if (exportResponse.status === 403) {
          router.push('/dashboard');
          return;
        }
        throw new Error('Failed to load export requests');
      }
      const exportData = await exportResponse.json();
      setExportRequests(exportData.requests || []);

      // Load deletion requests
      const deletionResponse = await fetch('/api/admin/privacy/deletion');
      if (!deletionResponse.ok) {
        throw new Error('Failed to load deletion requests');
      }
      const deletionData = await deletionResponse.json();
      setDeletionRequests(deletionData.requests || []);
    } catch (error: any) {
      console.error('Error loading GDPR requests:', error);
      setNotification({
        type: 'error',
        message: error.message || 'Failed to load requests',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const refreshRequests = () => {
    loadRequests();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Notification */}
        {notification && (
          <InlineNotification
            type={notification.type}
            message={notification.message}
            onDismiss={() => setNotification(null)}
          />
        )}

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">GDPR & Data Privacy</h1>
          <p className="text-gray-400">
            Manage data export and deletion requests in compliance with GDPR
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="export" className="space-y-6">
          <TabsList className="bg-slate-800/50 border-slate-700">
            <TabsTrigger
              value="export"
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <FileDown className="h-4 w-4" />
              Data Export Requests
            </TabsTrigger>
            <TabsTrigger
              value="deletion"
              className="flex items-center gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              <Trash2 className="h-4 w-4" />
              Deletion Requests
            </TabsTrigger>
          </TabsList>

          {/* Export Requests Tab */}
          <TabsContent value="export" className="space-y-6">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileDown className="h-5 w-5" />
                  GDPR Data Export Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-gray-400 text-center py-8">
                    Loading export requests...
                  </div>
                ) : (
                  <DataExportRequestsTable
                    requests={exportRequests}
                    onRefresh={refreshRequests}
                    setNotification={setNotification}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-blue-500/10 border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="h-5 w-5 text-blue-400" />
                  About Data Exports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-300">
                <p>
                  <strong className="text-blue-400">GDPR Article 15:</strong>{' '}
                  Users have the right to access their personal data.
                </p>
                <p>
                  <strong>Exports include:</strong> profile, settings, emails,
                  contacts, audit logs, support tickets, orders, and
                  subscriptions.
                </p>
                <p>
                  Data is provided in JSON format within a ZIP archive.
                  Sensitive tokens are redacted.
                </p>
                <p>
                  <strong>Processing Time:</strong> Most exports complete within
                  1 hour. Large accounts may take longer.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deletion Requests Tab */}
          <TabsContent value="deletion" className="space-y-6">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Trash2 className="h-5 w-5" />
                  Data Deletion Requests (Right to be Forgotten)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-gray-400 text-center py-8">
                    Loading deletion requests...
                  </div>
                ) : (
                  <DeletionRequestsTable
                    requests={deletionRequests}
                    onRefresh={refreshRequests}
                    setNotification={setNotification}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-red-500/10 border-red-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="h-5 w-5 text-red-400" />
                  About Data Deletion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-300">
                <p>
                  <strong className="text-red-400">GDPR Article 17:</strong>{' '}
                  Users have the right to be forgotten.
                </p>
                <p>
                  <strong>Grace Period:</strong> 30 days from request date.
                  Users can cancel during this time.
                </p>
                <p>
                  <strong>What Gets Deleted:</strong> All user data including
                  emails, attachments, contacts, settings, orders, and
                  subscriptions.
                </p>
                <p>
                  <strong>What Gets Anonymized:</strong> Audit logs are
                  anonymized (not deleted) for compliance purposes.
                </p>
                <p className="text-red-400 font-medium">
                  ⚠️ Deletion is permanent and cannot be undone after the grace
                  period.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
