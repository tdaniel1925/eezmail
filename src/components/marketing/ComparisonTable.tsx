'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

interface ComparisonTableProps {
  className?: string;
}

export function ComparisonTable({ className = '' }: ComparisonTableProps) {
  const competitors = ['easeMail', 'Gmail', 'Outlook', 'Superhuman', 'Hey'];
  
  const features = [
    {
      category: 'AI-Powered Features',
      items: [
        { name: 'RAG Semantic Search', values: [true, false, false, false, false] },
        { name: 'AI Assistant Chat', values: [true, false, false, false, false] },
        { name: 'Smart Compose (AI)', values: [true, true, false, false, false] },
        { name: 'Auto-Categorization', values: [true, true, true, false, false] },
        { name: 'Thread Analysis', values: [true, false, false, false, false] },
      ],
    },
    {
      category: 'Speed & Productivity',
      items: [
        { name: 'Keyboard Shortcuts', values: [true, true, true, true, true] },
        { name: 'Instant Search (<100ms)', values: [true, false, false, true, false] },
        { name: 'Bulk Operations', values: [true, true, true, false, false] },
        { name: 'Voice Dictation', values: [true, false, false, false, false] },
        { name: 'Scheduled Send', values: [true, true, true, true, true] },
        { name: 'Snooze Emails', values: [true, true, true, true, true] },
      ],
    },
    {
      category: 'Enterprise Features',
      items: [
        { name: 'Admin Dashboard', values: [true, true, true, false, false] },
        { name: 'Usage Analytics', values: [true, false, false, false, false] },
        { name: 'RBAC/Team Management', values: [true, true, true, false, false] },
        { name: 'SSO/SAML', values: [true, true, true, true, false] },
        { name: 'Audit Logs', values: [true, false, true, false, false] },
        { name: 'GDPR Compliance Tools', values: [true, true, true, false, false] },
      ],
    },
    {
      category: 'Integration & Flexibility',
      items: [
        { name: 'Gmail Integration', values: [true, true, false, true, true] },
        { name: 'Outlook Integration', values: [true, false, true, false, false] },
        { name: 'IMAP Support', values: [true, true, true, false, true] },
        { name: 'Calendar Sync', values: [true, true, true, true, true] },
        { name: 'Contact Management', values: [true, true, true, false, false] },
        { name: 'Data Export', values: [true, true, true, false, false] },
      ],
    },
    {
      category: 'Pricing',
      items: [
        { name: 'Free Tier', values: [true, true, true, false, false] },
        { name: 'Price (per user/mo)', values: ['$15-25', 'Free', 'Free', '$30', '$99'] },
        { name: '14-Day Free Trial', values: [true, false, false, true, false] },
      ],
    },
  ];

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left p-4 text-sm font-semibold text-white/80">Feature</th>
            {competitors.map((comp, idx) => (
              <th
                key={comp}
                className={`p-4 text-center text-sm font-semibold ${
                  idx === 0 ? 'text-[#FF4C5A]' : 'text-white/60'
                }`}
              >
                {comp}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((category) => (
            <React.Fragment key={category.category}>
              <tr className="border-t border-white/5">
                <td colSpan={6} className="p-4 text-sm font-semibold text-white/90 bg-white/5">
                  {category.category}
                </td>
              </tr>
              {category.items.map((feature, idx) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="p-4 text-sm text-white/70">{feature.name}</td>
                  {feature.values.map((value, valueIdx) => (
                    <td key={valueIdx} className="p-4 text-center">
                      {typeof value === 'boolean' ? (
                        value ? (
                          <Check className={`h-5 w-5 mx-auto ${valueIdx === 0 ? 'text-[#FF4C5A]' : 'text-emerald-400'}`} />
                        ) : (
                          <X className="h-5 w-5 mx-auto text-white/20" />
                        )
                      ) : (
                        <span className={`text-sm ${valueIdx === 0 ? 'text-[#FF4C5A] font-semibold' : 'text-white/60'}`}>
                          {value}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

