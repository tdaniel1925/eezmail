'use client';

import React from 'react';
import { Check, X, Minus } from 'lucide-react';

interface ComparisonFeature {
  category: string;
  features: {
    name: string;
    easeMail: boolean | string;
    gmail: boolean | string;
    outlook: boolean | string;
    superhuman: boolean | string;
  }[];
}

export function ComparisonTable() {
  const features: ComparisonFeature[] = [
    {
      category: 'AI & Productivity',
      features: [
        { name: 'AI-powered semantic search', easeMail: true, gmail: false, outlook: false, superhuman: 'Limited' },
        { name: 'Smart compose with context', easeMail: true, gmail: 'Basic', outlook: false, superhuman: true },
        { name: 'Thread summarization', easeMail: true, gmail: false, outlook: false, superhuman: false },
        { name: 'Auto-categorization', easeMail: true, gmail: 'Basic', outlook: 'Basic', superhuman: true },
        { name: 'Voice dictation', easeMail: true, gmail: false, outlook: false, superhuman: false },
        { name: 'RAG-powered context', easeMail: true, gmail: false, outlook: false, superhuman: false },
      ],
    },
    {
      category: 'Speed & Performance',
      features: [
        { name: 'Keyboard shortcuts', easeMail: true, gmail: 'Basic', outlook: 'Basic', superhuman: true },
        { name: 'Instant search (<120ms)', easeMail: true, gmail: false, outlook: false, superhuman: true },
        { name: 'Offline mode', easeMail: true, gmail: 'Limited', outlook: true, superhuman: false },
        { name: 'Bulk operations', easeMail: true, gmail: 'Basic', outlook: 'Basic', superhuman: true },
      ],
    },
    {
      category: 'Enterprise & Security',
      features: [
        { name: 'SOC 2 Type II certified', easeMail: true, gmail: true, outlook: true, superhuman: false },
        { name: 'GDPR compliant', easeMail: true, gmail: true, outlook: true, superhuman: true },
        { name: 'SSO/SAML support', easeMail: true, gmail: 'Paid', outlook: 'Paid', superhuman: 'Paid' },
        { name: 'On-premise deployment', easeMail: 'Enterprise', gmail: false, outlook: 'Limited', superhuman: false },
        { name: 'Custom data retention', easeMail: true, gmail: 'Paid', outlook: 'Paid', superhuman: false },
        { name: 'Audit logs', easeMail: true, gmail: 'Paid', outlook: 'Paid', superhuman: 'Paid' },
      ],
    },
    {
      category: 'Pricing',
      features: [
        { name: 'Starting price', easeMail: '$0/mo', gmail: 'Free', outlook: 'Free', superhuman: '$30/mo' },
        { name: 'Professional tier', easeMail: '$49/mo', gmail: '$12/mo', outlook: '$12.50/mo', superhuman: '$30/mo' },
        { name: 'Free trial', easeMail: '14 days', gmail: 'N/A', outlook: 'N/A', superhuman: '30 days' },
      ],
    },
  ];

  const renderCell = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-400 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-red-400/50 mx-auto" />
      );
    }
    return <span className="text-xs text-slate-300">{value}</span>;
  };

  return (
    <div className="rounded-3xl bg-slate-900/40 ring-1 ring-white/10 backdrop-blur-md overflow-hidden">
      <div className="p-6 md:p-8 border-b border-white/5">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Why easeMail Beats the Competition
        </h2>
        <p className="text-slate-400 mt-2">
          See how we compare to Gmail, Outlook, and Superhuman
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="p-4 text-left text-sm font-medium text-slate-400 sticky left-0 bg-slate-900/40 backdrop-blur-md z-10">
                Feature
              </th>
              <th className="p-4 text-center min-w-[120px]">
                <div className="text-sm font-semibold text-white mb-1">easeMail</div>
                <div className="text-xs text-[#1E40AF]">⭐ Best Value</div>
              </th>
              <th className="p-4 text-center min-w-[120px]">
                <div className="text-sm font-medium text-slate-300">Gmail</div>
              </th>
              <th className="p-4 text-center min-w-[120px]">
                <div className="text-sm font-medium text-slate-300">Outlook</div>
              </th>
              <th className="p-4 text-center min-w-[120px]">
                <div className="text-sm font-medium text-slate-300">Superhuman</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((category) => (
              <React.Fragment key={category.category}>
                <tr className="border-t border-white/10 bg-white/5">
                  <td colSpan={5} className="p-3 text-sm font-semibold text-white sticky left-0 bg-white/5 backdrop-blur-md z-10">
                    {category.category}
                  </td>
                </tr>
                {category.features.map((feature, idx) => (
                  <tr
                    key={feature.name}
                    className={`border-t border-white/5 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}`}
                  >
                    <td className="p-4 text-sm text-slate-300 sticky left-0 bg-slate-900/40 backdrop-blur-md z-10">
                      {feature.name}
                    </td>
                    <td className="p-4 text-center bg-[#1E40AF]/5">
                      {renderCell(feature.easeMail)}
                    </td>
                    <td className="p-4 text-center">{renderCell(feature.gmail)}</td>
                    <td className="p-4 text-center">{renderCell(feature.outlook)}</td>
                    <td className="p-4 text-center">{renderCell(feature.superhuman)}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-gradient-to-r from-[#1E40AF]/10 to-transparent border-t border-white/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold">Ready to make the switch?</p>
            <p className="text-sm text-slate-400">Start your free 14-day trial today</p>
          </div>
          <a
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1E40AF] text-white px-6 py-3 text-sm font-medium hover:bg-[#1E40AF]/90 transition whitespace-nowrap"
          >
            Get Started Free
          </a>
        </div>
      </div>
    </div>
  );
}

