/**
 * Folder Confirmation Component
 *
 * Beautiful UI for reviewing and confirming auto-detected folders
 * Hybrid approach: Auto-detection + user confirmation
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle,
  Folder,
  Loader2,
  Mail,
  ShieldAlert,
} from 'lucide-react';
import {
  getFolderTypeDisplay,
  type DetectedFolder,
} from '@/lib/folders/folder-detection';

interface FolderConfirmationProps {
  accountId: string;
}

export function FolderConfirmation({ accountId }: FolderConfirmationProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [account, setAccount] = useState<any>(null);
  const [folders, setFolders] = useState<DetectedFolder[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load detected folders
  useEffect(() => {
    fetchDetectedFolders();
  }, [accountId]);

  const fetchDetectedFolders = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/folders/detect?accountId=${accountId}`
      );
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to detect folders');
      }

      setAccount(data.account);
      setFolders(data.folders);
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (skipSetup = false) => {
    try {
      setSaving(true);

      // If skipping, just trigger sync without confirmation
      if (skipSetup) {
        await fetch('/api/sync/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId, trigger: 'oauth' }),
        });
      } else {
        // Save confirmed folders
        await fetch('/api/folders/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId,
            folders: folders.map((f) => ({
              ...f,
              wasModified: false, // Track if user changed anything (TODO: implement)
            })),
          }),
        });

        // Trigger sync
        await fetch('/api/sync/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId, trigger: 'oauth' }),
        });
      }

      // Redirect to dashboard
      router.push('/dashboard?setup=complete');
    } catch (err) {
      console.error('Error confirming folders:', err);
      setError(err instanceof Error ? err.message : 'Failed to save folders');
      setSaving(false);
    }
  };

  const handleTypeChange = (folderId: string, newType: string) => {
    setFolders((prev) =>
      prev.map((f) =>
        f.id === folderId
          ? { ...f, detectedType: newType as any, needsReview: false }
          : f
      )
    );
  };

  const handleToggleEnabled = (folderId: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const stats = {
    total: folders.length,
    enabled: folders.filter((f) => f.enabled).length,
    needsReview: folders.filter((f) => f.needsReview).length,
    highConfidence: folders.filter((f) => f.confidence >= 0.9).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Detecting folders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Error Loading Folders</span>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Folder className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Confirm Your Folders</h1>
          <p className="text-gray-600 dark:text-gray-400">
            We detected <strong>{stats.total} folders</strong> from{' '}
            <strong>{account?.emailAddress}</strong>
          </p>
        </div>

        {/* Stats Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.total}
                </div>
                <div className="text-sm text-gray-600">Total Folders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.highConfidence}
                </div>
                <div className="text-sm text-gray-600">High Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.needsReview}
                </div>
                <div className="text-sm text-gray-600">Needs Review</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.enabled}
                </div>
                <div className="text-sm text-gray-600">Will Sync</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Folders List */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Review & Adjust
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.needsReview > 0 && (
              <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start gap-2">
                <ShieldAlert className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-900 dark:text-orange-100">
                    {stats.needsReview} folder{stats.needsReview > 1 ? 's' : ''}{' '}
                    need review
                  </p>
                  <p className="text-orange-700 dark:text-orange-300">
                    These folders have low confidence or custom types. Please
                    verify they're correct.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {folders.map((folder) => {
                const display = getFolderTypeDisplay(folder.detectedType);

                return (
                  <div
                    key={folder.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${
                      folder.needsReview
                        ? 'border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary'
                    } ${!folder.enabled ? 'opacity-50' : ''}`}
                  >
                    <Checkbox
                      checked={folder.enabled}
                      onCheckedChange={() => handleToggleEnabled(folder.id)}
                    />

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-2xl">{display.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {folder.displayName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {folder.messageCount.toLocaleString()} emails
                        {folder.unreadCount > 0 &&
                          ` · ${folder.unreadCount} unread`}
                      </p>
                    </div>

                    <Select
                      value={folder.detectedType}
                      onValueChange={(value) =>
                        handleTypeChange(folder.id, value)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inbox">📥 Inbox</SelectItem>
                        <SelectItem value="sent">📤 Sent</SelectItem>
                        <SelectItem value="drafts">📝 Drafts</SelectItem>
                        <SelectItem value="trash">🗑️ Trash</SelectItem>
                        <SelectItem value="spam">⚠️ Spam</SelectItem>
                        <SelectItem value="archive">📦 Archive</SelectItem>
                        <SelectItem value="starred">⭐ Starred</SelectItem>
                        <SelectItem value="important">❗ Important</SelectItem>
                        <SelectItem value="custom">📁 Custom</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex-shrink-0">
                      {folder.confidence >= 0.9 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : folder.confidence >= 0.7 ? (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                      )}
                    </div>

                    {folder.confidence < 1.0 && (
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(folder.confidence * 100)}%
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            disabled={saving}
          >
            ← Cancel
          </Button>

          <Button
            variant="secondary"
            onClick={() => handleConfirm(true)}
            disabled={saving}
            className="flex-1"
          >
            Skip Setup (Use Defaults)
          </Button>

          <Button
            onClick={() => handleConfirm(false)}
            disabled={saving}
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting Sync...
              </>
            ) : (
              `Confirm & Sync ${stats.enabled} Folders →`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
