'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UserCog, Loader2 } from 'lucide-react';

interface ImpersonateButtonProps {
  userId: string;
  userEmail: string;
}

export function ImpersonateButton({ userId, userEmail }: ImpersonateButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImpersonate = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for impersonation');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/impersonate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start impersonation');
      }

      // Redirect to dashboard as the impersonated user
      window.location.href = data.redirectUrl || '/dashboard';
    } catch (error: any) {
      alert(error.message || 'Failed to impersonate user');
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-purple-600 hover:text-purple-700"
      >
        <UserCog className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Impersonate User</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">
                You are about to impersonate: <strong>{userEmail}</strong>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This action will be logged for security purposes.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (required)</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Troubleshooting login issue, helping with setup..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleImpersonate} disabled={loading || !reason.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Impersonation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

