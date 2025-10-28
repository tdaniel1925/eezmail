'use client';

import { useState } from 'react';
import { AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface AccountRemovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (disconnectOnly: boolean) => void;
  accountEmail: string;
  emailCount: number;
  folderCount: number;
  draftCount?: number;
}

export function AccountRemovalDialog({
  isOpen,
  onClose,
  onConfirm,
  accountEmail,
  emailCount,
  folderCount,
  draftCount = 0,
}: AccountRemovalDialogProps) {
  const [understood, setUnderstood] = useState(false);
  const [disconnectOnly, setDisconnectOnly] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6">
        {/* Warning icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          Remove Account?
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          {accountEmail}
        </p>

        {/* Data loss warning */}
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="font-medium text-red-900 dark:text-red-100 mb-2">
            This will permanently delete:
          </p>
          <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
            <li>• {emailCount.toLocaleString()} emails</li>
            <li>• {folderCount} folders</li>
            {draftCount > 0 && <li>• {draftCount} drafts</li>}
            <li>• All search history and filters</li>
          </ul>
        </div>

        {/* Alternative option */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={disconnectOnly}
              onCheckedChange={(checked) =>
                setDisconnectOnly(checked as boolean)
              }
            />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Disconnect temporarily instead
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Keep your data but stop syncing. You can reconnect anytime.
              </p>
            </div>
          </label>
        </div>

        {/* Export option */}
        <Button
          variant="outline"
          className="w-full mb-4"
          onClick={() => {
            // Trigger export
            window.open(`/api/export/account?id=${accountEmail}`, '_blank');
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Export My Data First
        </Button>

        {/* Confirmation checkbox */}
        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <Checkbox
            checked={understood}
            onCheckedChange={(checked) => setUnderstood(checked as boolean)}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            I understand this action{' '}
            {!disconnectOnly &&
              'cannot be undone and will permanently delete all my data'}
            {disconnectOnly && 'will stop syncing this account'}
          </span>
        </label>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(disconnectOnly)}
            disabled={!understood}
            className="flex-1"
          >
            {disconnectOnly ? 'Disconnect' : 'Delete Everything'}
          </Button>
        </div>
      </div>
    </div>
  );
}
