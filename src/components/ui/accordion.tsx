'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  multiple?: boolean;
  defaultOpen?: string[];
}

export function Accordion({
  items,
  multiple = false,
  defaultOpen = [],
}: AccordionProps): JSX.Element {
  const [openItems, setOpenItems] = React.useState<Set<string>>(
    new Set(defaultOpen)
  );

  const toggleItem = (id: string): void => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!multiple) {
          next.clear();
        }
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const isOpen = openItems.has(item.id);

        return (
          <div
            key={item.id}
            className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md overflow-hidden"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50/80 dark:hover:bg-white/5"
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {item.title}
              </span>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-gray-500 dark:text-white/60 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </button>
            {isOpen && (
              <div className="border-t border-gray-200 dark:border-white/10 px-4 py-3 text-sm text-gray-700 dark:text-white/80">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


