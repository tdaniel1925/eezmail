'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2, TestTube } from 'lucide-react';
import {
  wipeAllUserData,
  generateTestEmailData,
  verifyDataWipe,
} from '@/lib/settings/data-actions';
import { toast } from '@/lib/toast';

export function DangerZone(): JSX.Element {
  const [confirmText, setConfirmText] = useState('');
  const [isWiping, setIsWiping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyWipe = async (): Promise<void> => {
    setIsVerifying(true);

    try {
      const result = await verifyDataWipe();

      if (result.success && result.isClean) {
        toast.success('✅ All data has been successfully wiped!');
        console.log('Verification passed - database is clean');
      } else if (result.success) {
        const remaining = Object.entries(result.remainingData)
          .filter(([_, count]) => count > 0)
          .map(([table, count]) => `${table}: ${count}`)
          .join(', ');
        toast.warning(`⚠️ Some data remains: ${remaining}`);
        console.warn('Remaining data:', result.remainingData);
      } else {
        toast.error('Failed to verify data wipe');
      }

      // Show missing tables warning
      if (result.missingTables && result.missingTables.length > 0) {
        toast.warning(
          `⚠️ ${result.missingTables.length} database tables are missing. Check console for details.`
        );
        console.warn('Missing tables:', result.missingTables);
      }
    } catch (error) {
      console.error('Error verifying data:', error);
      toast.error('An unexpected error occurred during verification');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleWipeData = async (): Promise<void> => {
    if (confirmText !== 'DELETE ALL DATA') {
      toast.error('Please type "DELETE ALL DATA" to confirm');
      return;
    }

    if (!confirm('Are you absolutely sure? This action CANNOT be undone!')) {
      return;
    }

    setIsWiping(true);

    try {
      const result = await wipeAllUserData();

      if (result.success) {
        toast.success(
          'All data wiped successfully! You can now reconnect your accounts.'
        );
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        toast.error(result.error || 'Failed to wipe data');
        setIsWiping(false);
      }
    } catch (error) {
      console.error('Error wiping data:', error);
      toast.error('An unexpected error occurred');
      setIsWiping(false);
    }
  };

  const handleGenerateTestEmails = async (): Promise<void> => {
    setIsGenerating(true);

    try {
      // Use the simpler API route
      const response = await fetch('/api/simple-seed-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Successfully generated ${result.count} test emails!`);
        // Refresh the page after a short delay to show new emails
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(result.error || 'Failed to generate test emails');
      }
    } catch (error) {
      console.error('Error generating test emails:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Data Generation */}
      <div className="rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/20 p-6">
        <div className="flex items-start gap-3">
          <TestTube className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Generate Test Emails
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
              Generate sample emails for testing AI features. Creates ~10 emails
              in each folder (Inbox, Newsfeed, Receipts, Spam) with realistic
              content.
            </p>
            <button
              onClick={handleGenerateTestEmails}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isGenerating ? 'Generating...' : 'Generate Test Emails'}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950/20 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Danger Zone
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-2">
              <strong>⚠️ This will permanently delete ALL your data:</strong>
            </p>
            <ul className="text-sm text-red-700 dark:text-red-300 mb-4 space-y-1 ml-4">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">📧</span>
                <span>All emails, attachments, and email threads</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">👥</span>
                <span>All contacts, contact groups, and timeline events</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">📅</span>
                <span>All calendar events, reminders, and attendees</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">📬</span>
                <span>All email accounts and connection settings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">⚙️</span>
                <span>All settings, rules, signatures, and custom folders</span>
              </li>
            </ul>
            <div className="bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                ✓ Your user account and login credentials will be preserved
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                You can reconnect email accounts and start fresh after wiping data
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                ⚠️ This action cannot be undone!
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                All your data will be permanently deleted from our servers. You
                will stay logged in and can reconnect your email accounts to
                start fresh.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="confirm-text"
                  className="block text-sm font-medium text-red-900 dark:text-red-100 mb-2"
                >
                  Type{' '}
                  <code className="bg-red-200 dark:bg-red-900/50 px-2 py-0.5 rounded text-xs">
                    DELETE ALL DATA
                  </code>{' '}
                  to confirm:
                </label>
                <input
                  id="confirm-text"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE ALL DATA"
                  className="w-full px-3 py-2 border-2 border-red-300 dark:border-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={handleWipeData}
                disabled={confirmText !== 'DELETE ALL DATA' || isWiping}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <Trash2 size={16} />
                {isWiping ? 'Wiping All Data...' : 'Wipe All Data'}
              </button>
              <button
                onClick={handleVerifyWipe}
                disabled={isVerifying}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <TestTube size={16} />
                {isVerifying ? 'Verifying...' : 'Verify Data is Clean'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
