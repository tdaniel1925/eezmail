'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Plus, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { EmailAccount } from '@/db/schema';

interface AccountSelectorProps {
  accounts: EmailAccount[];
  currentAccountId: string | null;
  onAccountChange: (accountId: string) => void;
  onAddAccount: () => void;
  isCollapsed?: boolean;
}

export function AccountSelector({
  accounts,
  currentAccountId,
  onAccountChange,
  onAddAccount,
  isCollapsed = false,
}: AccountSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentAccount = accounts.find((acc) => acc.id === currentAccountId);

  const getProviderIcon = (provider: string) => {
    // Return appropriate icon or color based on provider
    switch (provider.toLowerCase()) {
      case 'gmail':
        return '🔴';
      case 'microsoft':
      case 'outlook':
        return '🔵';
      case 'yahoo':
        return '🟣';
      default:
        return '📧';
    }
  };

  const getInitials = (email: string | undefined) => {
    if (!email) return '?';
    return email.substring(0, 2).toUpperCase();
  };

  if (isCollapsed) {
    return (
      <div className="px-3 py-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold hover:bg-primary/20 transition-colors"
        >
          {currentAccount ? getInitials(currentAccount.emailAddress) : '?'}
        </button>
      </div>
    );
  }

  return (
    <div className="relative px-3 py-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200',
          'hover:bg-gray-100 dark:hover:bg-white/5 border-2 border-transparent',
          isOpen &&
            'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10'
        )}
      >
        {/* Avatar */}
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
          {currentAccount ? getInitials(currentAccount.emailAddress) : '?'}
        </div>

        {/* Account Info */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">
              {currentAccount && getProviderIcon(currentAccount.provider)}
            </span>
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {currentAccount?.emailAddress || 'No account'}
            </p>
          </div>
          {currentAccount && (
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {currentAccount.provider}
            </p>
          )}
        </div>

        {/* Dropdown Icon */}
        <ChevronDown
          size={16}
          className={cn(
            'flex-shrink-0 text-gray-500 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute left-3 right-3 top-full mt-2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Accounts List */}
              <div className="max-h-64 overflow-y-auto">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => {
                      onAccountChange(account.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 transition-colors',
                      'hover:bg-gray-50 dark:hover:bg-white/5',
                      account.id === currentAccountId &&
                        'bg-primary/5 border-l-2 border-primary'
                    )}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                      {getInitials(account.emailAddress)}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {account.emailAddress}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {account.provider}
                      </p>
                    </div>
                    {account.id === currentAccountId && (
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>

              {/* Add Account Button */}
              <div className="border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    onAddAccount();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                >
                  <Plus size={18} />
                  <span>Add Account</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
