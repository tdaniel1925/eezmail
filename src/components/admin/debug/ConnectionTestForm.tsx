'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';

interface ConnectionTestFormProps {
  onTest: (accountId: string) => Promise<void>;
  loading: boolean;
}

export function ConnectionTestForm({
  onTest,
  loading,
}: ConnectionTestFormProps): JSX.Element {
  const [accountId, setAccountId] = useState('');

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!accountId.trim()) return;
    await onTest(accountId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Email Connection</CardTitle>
        <CardDescription>
          Enter an email account ID to test connectivity and diagnose issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountId">Email Account ID</Label>
            <div className="flex gap-2">
              <Input
                id="accountId"
                placeholder="Enter account UUID..."
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !accountId.trim()}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Test
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
