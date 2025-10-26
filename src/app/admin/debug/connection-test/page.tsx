'use client';

import { useState } from 'react';
import { ConnectionTestForm } from '@/components/admin/debug/ConnectionTestForm';
import { TestResults } from '@/components/admin/debug/TestResults';

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

  const handleTest = async (testAccountId: string): Promise<void> => {
    setLoading(true);
    setAccountId(testAccountId);
    setResults(null);

    try {
      const response = await fetch('/api/admin/connection-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId: testAccountId }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Failed to test connection:', error);
      setResults({
        success: false,
        tests: [],
        overall: {
          healthy: false,
          score: 0,
          recommendations: [
            'Failed to perform diagnostic test. Please check server logs.',
          ],
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Connection Tester</h1>
        <p className="text-muted-foreground">
          Diagnose email provider connectivity issues and validate OAuth tokens
        </p>
      </div>

      <div className="space-y-6">
        <ConnectionTestForm onTest={handleTest} loading={loading} />
        <TestResults results={results} accountId={accountId} />
      </div>
    </div>
  );
}
