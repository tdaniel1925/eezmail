'use client';

import { useState } from 'react';
import { ConnectionTestForm } from '@/components/admin/debug/ConnectionTestForm';
import { TestResults } from '@/components/admin/debug/TestResults';
import { AlertCircle, XCircle } from 'lucide-react';

interface DiagnosticResult {
  success: boolean;
  tests: {
    name: string;
    passed: boolean;
    message: string;
    duration: number;
  }[];
  overall: {
    healthy: boolean;
    score: number;
    recommendations: string[];
  };
}

export default function ConnectionTestPage(): JSX.Element {
  const [results, setResults] = useState<DiagnosticResult | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async (testAccountId: string): Promise<void> => {
    setLoading(true);
    setAccountId(testAccountId);
    setResults(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/connection-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId: testAccountId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Failed to test connection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      setResults({
        success: false,
        tests: [],
        overall: {
          healthy: false,
          score: 0,
          recommendations: [
            `Failed to perform diagnostic test: ${errorMessage}`,
            'Check that the account ID is valid',
            'Ensure the account has not been deleted',
          ],
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      {/* Page Header with Explanation */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Connection Tester
        </h1>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-200 mb-3">
            <strong>🔌 What is this page for?</strong>
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
            This tool diagnoses email provider connectivity issues and validates OAuth tokens for Gmail, Microsoft, and IMAP accounts.
            Use it to troubleshoot sync problems, expired credentials, or connection failures.
          </p>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li><strong>Database Connection:</strong> Verifies the account exists in the database</li>
            <li><strong>OAuth Token Validation:</strong> Checks if tokens are valid and not expired (Gmail/Microsoft)</li>
            <li><strong>API Connectivity:</strong> Tests actual connection to email provider servers</li>
            <li><strong>Mailbox Access:</strong> Validates read/write permissions</li>
            <li><strong>Health Score:</strong> Overall connection quality rating (0-100)</li>
          </ul>
          <p className="text-sm text-blue-800 dark:text-blue-300 mt-3">
            💡 <strong>How to use:</strong> Get an account UUID from the Users page or email_accounts table, paste it below, and click "Test" to run diagnostics.
          </p>
        </div>
      </div>

      {/* Inline Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              Connection Test Failed
            </p>
            <p className="text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-600 dark:text-red-400 underline mt-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <ConnectionTestForm onTest={handleTest} loading={loading} />
        <TestResults results={results} accountId={accountId} />
      </div>
    </div>
  );
}
