'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AISummaryBoxProps {
  summary: string;
  quickReplies?: string[];
  onQuickReply?: (reply: string) => void;
  className?: string;
}

export function AISummaryBox({
  summary,
  quickReplies,
  onQuickReply,
  className,
}: AISummaryBoxProps): JSX.Element {
  return (
    <div
      className={cn(
        'rounded-xl p-5 transition-all duration-300',
        'bg-gradient-to-br from-[#1e3a5f] to-[#1e40af]',
        'border-l-4 border-[var(--accent-blue)]',
        'dark:from-[#1e3a5f] dark:to-[#1e40af]',
        'light:from-[#eff6ff] light:to-[#dbeafe]',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <Sparkles size={14} className="text-[#93c5fd] dark:text-[#93c5fd]" />
        <span className="text-[13px] font-semibold text-[#93c5fd] dark:text-[#93c5fd] tracking-wide">
          AI SUMMARY
        </span>
        <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-semibold rounded uppercase tracking-wider">
          NEW
        </span>
      </div>

      {/* Summary Text */}
      <p
        className="text-sm leading-relaxed mb-3.5 text-[#e0e7ff] dark:text-[#e0e7ff]"
        style={{ lineHeight: '1.7' }}
      >
        {summary}
      </p>

      {/* Quick Replies */}
      {quickReplies && quickReplies.length > 0 && (
        <div className="pt-3.5 border-t border-[var(--accent-blue)]">
          <div className="text-xs font-semibold text-[#93c5fd] dark:text-[#93c5fd] mb-2.5">
            ⚡ QUICK REPLIES
          </div>
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                onClick={() => onQuickReply?.(reply)}
                className={cn(
                  'px-3.5 py-2 rounded-lg text-[13px] transition-all duration-200',
                  'bg-[#0f172a] border border-[var(--accent-blue)] text-[#93c5fd]',
                  'hover:bg-[#1e293b] hover:border-[#60a5fa] hover:-translate-y-0.5',
                  'dark:bg-[#0f172a] dark:text-[#93c5fd]',
                  'light:bg-white light:text-[#1e40af]'
                )}
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

