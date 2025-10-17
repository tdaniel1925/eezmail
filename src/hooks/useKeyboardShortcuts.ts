'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSidebarStore } from '@/stores/sidebarStore';
import { toast } from 'sonner';

interface UseKeyboardShortcutsOptions {
  onCompose?: () => void;
  onSearch?: () => void;
  onCommandPalette?: () => void;
}

export function useKeyboardShortcuts(
  options: UseKeyboardShortcutsOptions = {}
) {
  const router = useRouter();
  const { setActiveFolder } = useSidebarStore();

  // Folder Navigation Shortcuts (g + key)
  // These use a sequence pattern where you press 'g' then another key

  // g+i -> Inbox
  useHotkeys(
    'g,i',
    () => {
      setActiveFolder('inbox');
      router.push('/dashboard/inbox');
      toast.info('Inbox');
    },
    { enableOnFormTags: false }
  );

  // g+s -> Sent
  useHotkeys(
    'g,s',
    () => {
      setActiveFolder('sent');
      router.push('/dashboard/sent');
      toast.info('Sent');
    },
    { enableOnFormTags: false }
  );

  // g+d -> Drafts
  useHotkeys(
    'g,d',
    () => {
      setActiveFolder('drafts');
      router.push('/dashboard/drafts');
      toast.info('Drafts');
    },
    { enableOnFormTags: false }
  );

  // g+a -> All Mail
  useHotkeys(
    'g,a',
    () => {
      setActiveFolder('all');
      router.push('/dashboard/all');
      toast.info('All Mail');
    },
    { enableOnFormTags: false }
  );

  // g+t -> Trash
  useHotkeys(
    'g,t',
    () => {
      setActiveFolder('trash');
      router.push('/dashboard/trash');
      toast.info('Trash');
    },
    { enableOnFormTags: false }
  );

  // g+r -> Reply Queue
  useHotkeys(
    'g,r',
    () => {
      setActiveFolder('reply-queue');
      router.push('/dashboard/reply-queue');
      toast.info('Reply Queue');
    },
    { enableOnFormTags: false }
  );

  // g+e -> Screener
  useHotkeys(
    'g,e',
    () => {
      setActiveFolder('screener');
      router.push('/dashboard/screener');
      toast.info('Screener');
    },
    { enableOnFormTags: false }
  );

  // g+n -> News Feed
  useHotkeys(
    'g,n',
    () => {
      setActiveFolder('newsfeed');
      router.push('/dashboard/newsfeed');
      toast.info('News Feed');
    },
    { enableOnFormTags: false }
  );

  // Quick Actions

  // c -> Compose
  useHotkeys(
    'c',
    () => {
      if (options.onCompose) {
        options.onCompose();
      } else {
        router.push('/dashboard/compose');
        toast.info('Compose');
      }
    },
    { enableOnFormTags: false }
  );

  // / -> Search
  useHotkeys(
    '/',
    (e) => {
      e.preventDefault();
      if (options.onSearch) {
        options.onSearch();
      } else {
        // Focus search input
        const searchInput = document.querySelector(
          '[data-search-input]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
        toast.info('Search');
      }
    },
    { enableOnFormTags: false }
  );

  // Cmd/Ctrl + K -> Command Palette
  useHotkeys(
    'mod+k',
    (e) => {
      e.preventDefault();
      if (options.onCommandPalette) {
        options.onCommandPalette();
      }
    },
    { enableOnFormTags: true }
  );

  // Cmd/Ctrl + B -> Toggle Sidebar
  useHotkeys(
    'mod+b',
    (e) => {
      e.preventDefault();
      useSidebarStore.getState().toggleCollapse();
      toast.info(
        useSidebarStore.getState().isCollapsed
          ? 'Sidebar collapsed'
          : 'Sidebar expanded'
      );
    },
    { enableOnFormTags: true }
  );

  // Escape -> Close modals/command palette (handled by individual components)

  return null;
}
