'use client';

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabSystemProps {
  tabs: Tab[];
  className?: string;
}

export function TabSystem({ tabs, className = '' }: TabSystemProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');

  return (
    <div className={className}>
      {/* Tab Navigation */}
      <div className="flex justify-between items-center gap-4 mb-8 pb-4 border-b border-white/10 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-3 text-center transition-all duration-300 whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-white/50 hover:text-white/75'
            }`}
          >
            <div className="font-semibold text-lg">{tab.label}</div>
            {activeTab === tab.id && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#1E40AF] to-[#3B82F6]"
                layoutId="activeTab"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {tabs.map((tab) =>
          tab.id === activeTab ? (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {tab.content}
            </motion.div>
          ) : null
        )}
      </AnimatePresence>
    </div>
  );
}

