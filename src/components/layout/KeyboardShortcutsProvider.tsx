'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { CommandPalette } from '@/components/sidebar/CommandPalette';

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
}

export function KeyboardShortcutsProvider({
  children,
}: KeyboardShortcutsProviderProps) {
  const router = useRouter();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    onCompose: () => {
      router.push('/dashboard/compose');
    },
    onSearch: () => {
      // Focus search input
      const searchInput = document.querySelector(
        '[data-search-input]'
      ) as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
    onCommandPalette: () => {
      setIsCommandPaletteOpen(true);
    },
  });

  return (
    <>
      {children}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onCompose={() => {
          router.push('/dashboard/compose');
        }}
      />
    </>
  );
}
