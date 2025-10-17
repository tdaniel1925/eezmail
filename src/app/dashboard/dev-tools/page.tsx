'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DevToolsPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleCreateTestAccount = async () => {
    setIsCreatingAccount(true);
    try {
      const response = await fetch('/api/create-test-account', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Test account created successfully!');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(data.error || 'Failed to create test account');
      }
    } catch (error) {
      toast.error('An error occurred while creating test account');
      console.error(error);
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleSeedEmails = async () => {
    setIsSeeding(true);
    try {
      const response = await fetch('/api/seed-emails', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Emails seeded successfully!');
        // Refresh the page after 1 second
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(data.error || 'Failed to seed emails');
      }
    } catch (error) {
      toast.error('An error occurred while seeding emails');
      console.error(error);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearEmails = async () => {
    if (!confirm('Are you sure you want to delete all test emails?')) {
      return;
    }

    setIsClearing(true);
    try {
      const response = await fetch('/api/clear-test-emails', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Test emails cleared!');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(data.error || 'Failed to clear emails');
      }
    } catch (error) {
      toast.error('An error occurred while clearing emails');
      console.error(error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          🛠️ Developer Tools
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Test and development utilities
        </p>

        <div className="space-y-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              1. Create Test Email Account
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Create a test email account (test@example.com) to use for
              development.
            </p>
            <Button
              onClick={handleCreateTestAccount}
              disabled={isCreatingAccount}
              className="w-full"
              variant="outline"
            >
              {isCreatingAccount ? 'Creating...' : '👤 Create Test Account'}
            </Button>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              2. Seed Test Emails
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Add 10 dummy emails to your inbox for testing, including 3
              threaded conversations.
            </p>
            <Button
              onClick={handleSeedEmails}
              disabled={isSeeding}
              className="w-full"
            >
              {isSeeding ? 'Seeding...' : '📧 Seed Test Emails'}
            </Button>
          </div>

          <div className="border border-red-200 dark:border-red-700 rounded-lg p-4 bg-red-50 dark:bg-red-900/10">
            <h3 className="font-semibold text-red-900 dark:text-red-400 mb-2">
              Clear Test Emails
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              Delete all test emails from your inbox. This cannot be undone.
            </p>
            <Button
              onClick={handleClearEmails}
              disabled={isClearing}
              variant="destructive"
              className="w-full"
            >
              {isClearing ? 'Clearing...' : '🗑️ Clear All Test Emails'}
            </Button>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-500 text-center">
            <p>These are development tools for testing purposes only.</p>
            <p className="mt-1">Run step 1 first, then step 2.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
