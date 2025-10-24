'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Mail,
  Zap,
  AlertTriangle,
  ExternalLink,
  Folder,
  Loader2,
  ChevronDown,
  MoreVertical,
  Link as LinkIcon,
  Trash2,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface AccountStatusCardProps {
  accountId: string;
  emailAddress: string;
  provider: string;
  status: 'active' | 'syncing' | 'error' | 'disconnected';
  lastSyncAt?: Date | null;
  syncProgress?: number;
  syncTotal?: number;
  errorMessage?: string | null;
  isDefault?: boolean;
  emailCount?: number;
  folderCount?: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onSetDefault?: () => void;
  onSync?: () => void;
  onReconnect?: () => void;
  onRemove?: () => void;
  onRetry?: () => void;
  onTroubleshoot?: () => void;
}

export function AccountStatusCard({
  emailAddress,
  provider,
  status,
  lastSyncAt,
  syncProgress = 0,
  syncTotal = 0,
  errorMessage,
  isDefault,
  emailCount,
  folderCount,
  isExpanded,
  onToggleExpand,
  onSetDefault,
  onSync,
  onReconnect,
  onRemove,
  onRetry,
  onTroubleshoot,
}: AccountStatusCardProps) {
  const [showPulse, setShowPulse] = useState(false);

  // Show pulse animation when status changes to active
  useEffect(() => {
    if (status === 'active' && !lastSyncAt) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [status, lastSyncAt]);

  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          color: 'bg-green-500',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-700 dark:text-green-300',
          icon: CheckCircle2,
          label: 'Connected',
          pulse: showPulse,
        };
      case 'syncing':
        return {
          color: 'bg-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-700 dark:text-blue-300',
          icon: RefreshCw,
          label: 'Syncing',
          pulse: true,
        };
      case 'error':
        return {
          color: 'bg-red-500',
          bgColor: 'bg-red-50 dark:bg-red-950/20',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-700 dark:text-red-300',
          icon: AlertCircle,
          label: 'Error',
          pulse: false,
        };
      case 'disconnected':
        return {
          color: 'bg-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-950/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          textColor: 'text-gray-700 dark:text-gray-300',
          icon: AlertCircle,
          label: 'Disconnected',
          pulse: false,
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  const formatTimeAgo = (date: Date | null | undefined) => {
    if (!date) return 'Just now';
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000
    );
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const providerName =
    provider === 'microsoft'
      ? 'Microsoft'
      : provider === 'gmail'
        ? 'Gmail'
        : provider;

  // Check if error is permission-related
  const isPermissionError =
    errorMessage &&
    (errorMessage.toLowerCase().includes('permission') ||
      errorMessage.toLowerCase().includes('forbidden') ||
      errorMessage.toLowerCase().includes('access denied') ||
      errorMessage.toLowerCase().includes('reconnect'));

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 p-4 transition-all',
        config.bgColor,
        config.borderColor,
        onToggleExpand &&
          'cursor-pointer hover:shadow-md hover:border-opacity-80'
      )}
    >
      {/* Status indicator and kebab menu */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className={`h-3 w-3 rounded-full ${config.color}`} />
            {config.pulse && (
              <>
                <div
                  className={`absolute inset-0 h-3 w-3 rounded-full ${config.color} animate-ping opacity-75`}
                />
                <div
                  className={`absolute inset-0 h-3 w-3 rounded-full ${config.color} animate-pulse`}
                />
              </>
            )}
          </div>
          <span className={`text-sm font-medium ${config.textColor}`}>
            {config.label}
          </span>
        </div>

        {/* Kebab menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors">
              <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {!isDefault && onSetDefault && (
              <DropdownMenuItem onClick={onSetDefault}>
                <Zap className="h-4 w-4 mr-2" />
                Set as Default
              </DropdownMenuItem>
            )}
            {onSync && (
              <DropdownMenuItem onClick={onSync}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </DropdownMenuItem>
            )}
            {status === 'error' && onReconnect && (
              <DropdownMenuItem onClick={onReconnect}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Reconnect Account
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onRemove && (
              <DropdownMenuItem
                onClick={onRemove}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Account
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Account info */}
      <div className="flex items-start gap-3 pr-28">
        <div className={`rounded-full p-2 ${config.bgColor}`}>
          <Mail className={`h-5 w-5 ${config.textColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {emailAddress}
            </h3>
            {isDefault && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                <Zap className="h-3 w-3" />
                Default
              </span>
            )}
          </div>
          <p className="text-sm font-normal text-gray-600 dark:text-gray-400 opacity-80">
            {providerName} Account
          </p>
        </div>
      </div>

      {/* Always visible stats */}
      {(emailCount !== undefined || folderCount !== undefined) && (
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          {emailCount !== undefined && (
            <span className="flex items-center gap-1.5">
              <Mail className="h-4 w-4" />
              <strong className="font-semibold text-gray-900 dark:text-white">
                {emailCount.toLocaleString()}
              </strong>{' '}
              emails
            </span>
          )}
          {folderCount !== undefined && (
            <span className="flex items-center gap-1.5">
              <Folder className="h-4 w-4" />
              <strong className="font-semibold text-gray-900 dark:text-white">
                {folderCount}
              </strong>{' '}
              folders
            </span>
          )}
          {status === 'syncing' && syncProgress > 0 && syncProgress < 100 && (
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {syncProgress}% synced
            </span>
          )}
        </div>
      )}

      {/* Expandable toggle button */}
      {onToggleExpand && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="mt-3 flex items-center gap-2 text-sm text-primary hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
        >
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
          />
          {isExpanded ? 'Hide' : 'View'} Sync Details
        </button>
      )}

      {/* Sync status */}
      <div className="mt-4 space-y-2">
        {status === 'syncing' && syncTotal > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Syncing emails...
              </span>
              <span className={`font-medium ${config.textColor}`}>
                {syncProgress} / {syncTotal}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${config.color}`}
                style={{ width: `${(syncProgress / syncTotal) * 100}%` }}
              />
            </div>
          </div>
        )}

        {status === 'active' && lastSyncAt && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <RefreshCw className="h-4 w-4" />
            <span>Last synced {formatTimeAgo(lastSyncAt)}</span>
          </div>
        )}

        {status === 'active' && !lastSyncAt && (
          <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              Account connected successfully! Starting initial sync...
            </span>
          </div>
        )}

        {status === 'error' && errorMessage && (
          <div className="space-y-3">
            {/* Error message */}
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Sync Error
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {errorMessage}
                </p>
              </div>
            </div>

            {/* Recovery actions */}
            <div className="flex flex-wrap items-center gap-2">
              {onRetry && (
                <Button size="sm" variant="outline" onClick={onRetry}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Retry Sync
                </Button>
              )}
              {onTroubleshoot && (
                <Button size="sm" variant="ghost" onClick={onTroubleshoot}>
                  <Wrench className="h-3.5 w-3.5 mr-1.5" />
                  Troubleshoot
                </Button>
              )}
              {isPermissionError && onReconnect && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={onReconnect}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                  Reconnect Account
                </Button>
              )}
            </div>

            {/* Permission error guidance (only if no action buttons shown above) */}
            {isPermissionError && !onReconnect && (
              <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Action Required: Reconnect Your Account
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      {provider === 'microsoft'
                        ? 'Microsoft has revoked or limited access to your account. This typically happens when permissions expire or security settings change.'
                        : 'Your email provider has revoked access. Please reconnect to restore sync.'}
                    </p>
                    <a
                      href="https://support.microsoft.com/account-billing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-300 hover:underline"
                    >
                      Learn more about permissions
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
