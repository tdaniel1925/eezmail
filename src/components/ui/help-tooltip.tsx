'use client';

import { HelpCircle, ExternalLink } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HelpTooltipProps {
  content: string;
  example?: string;
  learnMoreUrl?: string;
}

export function HelpTooltip({
  content,
  example,
  learnMoreUrl,
}: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            <p className="text-sm">{content}</p>
            {example && (
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                <p className="font-medium mb-1">Example:</p>
                <p>{example}</p>
              </div>
            )}
            {learnMoreUrl && (
              <a
                href={learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Learn more
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
