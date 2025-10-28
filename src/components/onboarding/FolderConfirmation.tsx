/**
 * Folder Confirmation Component
 *
 * Beautiful UI for reviewing and confirming auto-detected folders
 * Hybrid approach: Auto-detection + user confirmation
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import {
  getFolderTypeDisplay,
  type DetectedFolder,
} from '@/lib/folders/folder-detection';
import { cn } from '@/lib/utils';

interface FolderConfirmationProps {
  accountId: string;
  isOptional?: boolean;
  isRequired?: boolean;
}

export function FolderConfirmation({
  accountId,
  isOptional = false,
  isRequired = false,
}: FolderConfirmationProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [account, setAccount] = useState<any>(null);
  const [folders, setFolders] = useState<DetectedFolder[]>([]);
  const [error, setError] = useState<string | null>(null);

  // New state for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'important' | 'custom'>(
    'all'
  );
  const [hideEmpty, setHideEmpty] = useState(false);
  const [showStandard, setShowStandard] = useState(true);
  const [showCustom, setShowCustom] = useState(true);

  console.log('[FOLDER_CONFIRMATION] Loaded folders:', folders.length);

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

  const handleUseSmartDefaults = async () => {
    try {
      setSaving(true);

      // Apply smart defaults via API
      const response = await fetch('/api/folders/smart-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to apply smart defaults');
      }

      // Redirect to dashboard with success message
      router.push('/dashboard?setup=complete&smartDefaults=true');
    } catch (err) {
      console.error('Error applying smart defaults:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to apply smart defaults'
      );
      setSaving(false);
    }
  };

  // Bulk actions
  const handleSelectAllStandard = () => {
    console.log('[FOLDER_CONFIRMATION] Selecting all standard folders');
    const standardTypes = [
      'inbox',
      'sent',
      'drafts',
      'trash',
      'spam',
      'archive',
    ];
    setFolders((prev) =>
      prev.map((f) =>
        standardTypes.includes(f.detectedType) ? { ...f, enabled: true } : f
      )
    );
  };

  const handleDeselectCustom = () => {
    console.log('[FOLDER_CONFIRMATION] Deselecting custom folders');
    setFolders((prev) =>
      prev.map((f) =>
        f.detectedType === 'custom' ? { ...f, enabled: false } : f
      )
    );
  };

  const handleSelectAll = () => {
    console.log('[FOLDER_CONFIRMATION] Selecting all folders');
    setFolders((prev) => prev.map((f) => ({ ...f, enabled: true })));
  };

  const handleDeselectAll = () => {
    console.log('[FOLDER_CONFIRMATION] Deselecting all folders');
    setFolders((prev) => prev.map((f) => ({ ...f, enabled: false })));
  };

  // Filtered folders based on search and filters
  const filteredFolders = useMemo(() => {
    console.log('[FOLDER_CONFIRMATION] Filtering folders:', {
      searchQuery,
      filterType,
      hideEmpty,
    });

    return folders.filter((folder) => {
      // Search filter
      if (
        searchQuery &&
        !folder.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Empty folder filter
      if (hideEmpty && folder.messageCount === 0) {
        return false;
      }

      // Type filter
      const standardTypes = [
        'inbox',
        'sent',
        'drafts',
        'trash',
        'spam',
        'archive',
      ];
      const isStandard = standardTypes.includes(folder.detectedType);

      if (
        filterType === 'important' &&
        (!isStandard || folder.messageCount === 0)
      ) {
        return false;
      }

      if (filterType === 'custom' && isStandard) {
        return false;
      }

      return true;
    });
  }, [folders, searchQuery, filterType, hideEmpty]);

  // Separate standard and custom folders for categorization
  const standardFolders = useMemo(() => {
    const standardTypes = [
      'inbox',
      'sent',
      'drafts',
      'trash',
      'spam',
      'archive',
    ];
    return filteredFolders.filter((f) =>
      standardTypes.includes(f.detectedType)
    );
  }, [filteredFolders]);

  const customFolders = useMemo(() => {
    const standardTypes = [
      'inbox',
      'sent',
      'drafts',
      'trash',
      'spam',
      'archive',
    ];
    return filteredFolders.filter(
      (f) => !standardTypes.includes(f.detectedType)
    );
  }, [filteredFolders]);

  // Render individual folder row
  const renderFolder = (folder: DetectedFolder) => {
    const display = getFolderTypeDisplay(folder.detectedType);

    return (
      <div
        key={folder.id}
        className={cn(
          'flex items-center gap-3 p-3 border rounded-lg transition-all',
          folder.needsReview
            ? 'border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/30'
            : 'border-gray-200 dark:border-gray-700 hover:border-primary',
          !folder.enabled && 'opacity-50'
        )}
      >
        <Checkbox
          checked={folder.enabled}
          onCheckedChange={() => handleToggleEnabled(folder.id)}
        />

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl">{display.icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{folder.displayName}</p>
          <p className="text-sm text-gray-500">
            {folder.messageCount.toLocaleString()} emails
            {folder.unreadCount > 0 && ` · ${folder.unreadCount} unread`}
          </p>
        </div>

        <Select
          value={folder.detectedType}
          onValueChange={(value) => handleTypeChange(folder.id, value)}
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

        {/* Confidence indicator - replaced % with icons */}
        <div
          className="flex-shrink-0"
          title={`${Math.round(folder.confidence * 100)}% confidence`}
        >
          {folder.confidence >= 0.9 ? (
            <CheckCircle
              className="h-5 w-5 text-green-500"
              title="High confidence"
            />
          ) : folder.confidence >= 0.7 ? (
            <AlertCircle
              className="h-5 w-5 text-yellow-500"
              title="Medium confidence - review recommended"
            />
          ) : (
            <AlertCircle
              className="h-5 w-5 text-orange-500"
              title="Low confidence - please verify"
            />
          )}
        </div>
      </div>
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

        {/* Smart Defaults Option (for optional mode) */}
        {isOptional && (
          <Card className="mb-6 border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    ⚡ Quick Setup Available
                  </h3>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 mb-4 space-y-1">
                    <li>
                      ✓ Standard folders (Inbox, Sent, Drafts, Archive, Spam,
                      Trash)
                    </li>
                    <li>✓ Skip custom folder setup</li>
                    <li>✓ Start syncing in 5 seconds</li>
                  </ul>
                  <Button
                    onClick={handleUseSmartDefaults}
                    disabled={saving}
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Applying...
                      </>
                    ) : (
                      <>⚡ Use Smart Defaults & Start Syncing</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
          <CardContent className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="space-y-3">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-800"
                />
              </div>

              {/* Filter buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  Show:
                </span>
                <button
                  onClick={() => setFilterType('all')}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-full transition-colors',
                    filterType === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                >
                  All ({folders.length})
                </button>
                <button
                  onClick={() => setFilterType('important')}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-full transition-colors',
                    filterType === 'important'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                >
                  Important Only ({standardFolders.length})
                </button>
                <button
                  onClick={() => setFilterType('custom')}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-full transition-colors',
                    filterType === 'custom'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                >
                  Custom ({customFolders.length})
                </button>
                <label className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-full bg-gray-100 dark:bg-gray-800 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700">
                  <Checkbox
                    checked={hideEmpty}
                    onCheckedChange={(checked) =>
                      setHideEmpty(checked as boolean)
                    }
                  />
                  <span>Hide empty</span>
                </label>
              </div>

              {/* Bulk actions */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bulk actions:
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSelectAllStandard}
                >
                  ✓ Select Standard
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDeselectCustom}
                >
                  ✗ Deselect Custom
                </Button>
                <Button size="sm" variant="ghost" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDeselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            {stats.needsReview > 0 && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start gap-2">
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

            {/* Folder count summary */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredFolders.length} of {folders.length} folders
              {searchQuery && ` matching "${searchQuery}"`}
            </div>

            {/* Categorized folder list */}
            <div className="space-y-4">
              {/* Standard folders section */}
              {standardFolders.length > 0 && showStandard && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowStandard(!showStandard)}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
                  >
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        !showStandard && '-rotate-90'
                      )}
                    />
                    Standard Folders ({standardFolders.length})
                  </button>
                  {showStandard && (
                    <div className="space-y-2 pl-6 max-h-[300px] overflow-y-auto pr-2">
                      {standardFolders.map((folder) => renderFolder(folder))}
                    </div>
                  )}
                </div>
              )}

              {/* Custom folders section */}
              {customFolders.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowCustom(!showCustom)}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
                  >
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        !showCustom && '-rotate-90'
                      )}
                    />
                    Custom Folders ({customFolders.length})
                    <HelpCircle
                      className="h-4 w-4 text-gray-400"
                      title="Custom folders will sync with their original name from your email provider"
                    />
                  </button>
                  {showCustom && (
                    <div className="space-y-2 pl-6 max-h-[300px] overflow-y-auto pr-2">
                      {customFolders.map((folder) => renderFolder(folder))}
                    </div>
                  )}
                </div>
              )}

              {/* No results message */}
              {filteredFolders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No folders match your filters</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterType('all');
                      setHideEmpty(false);
                    }}
                    className="text-primary hover:underline text-sm mt-2"
                  >
                    Clear filters
                  </button>
                </div>
              )}
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
