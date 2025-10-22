'use client';

import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  Shield,
  X,
  Trash2,
  Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PhishingAnalysis } from '@/lib/security/phishing-detector';

interface PhishingAlertProps {
  emailId: string;
  fromAddress: string;
  fromName?: string;
  subject: string;
  bodyText: string;
  links?: string[];
  onDelete?: () => void;
  onQuarantine?: () => void;
  enabled?: boolean;
}

export function PhishingAlert({
  emailId,
  fromAddress,
  fromName,
  subject,
  bodyText,
  links,
  onDelete,
  onQuarantine,
  enabled = true,
}: PhishingAlertProps): JSX.Element | null {
  const [analysis, setAnalysis] = useState<PhishingAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Check if we should analyze this email
    analyzeEmail();
  }, [emailId, enabled]);

  const analyzeEmail = async () => {
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/security/detect-phishing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId,
          fromAddress,
          fromName,
          subject,
          bodyText,
          links,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalysis(data.analysis);
        }
      }
    } catch (error) {
      console.error('Phishing analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!enabled || isDismissed) {
    return null;
  }

  if (isAnalyzing) {
    return (
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg flex items-center gap-2">
        <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse" />
        <span className="text-sm text-blue-800 dark:text-blue-200">
          Analyzing email for phishing...
        </span>
      </div>
    );
  }

  // Only show alert if phishing is detected
  if (!analysis || !analysis.isPhishing) {
    return null;
  }

  const { confidence, riskLevel, indicators, recommendation, reasons } =
    analysis;

  // Risk level styling
  const riskConfig = {
    critical: {
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-300 dark:border-red-700',
      textColor: 'text-red-900 dark:text-red-100',
      iconColor: 'text-red-600 dark:text-red-400',
      icon: ShieldAlert,
      title: '⚠️ CRITICAL: Phishing Email Detected',
    },
    high: {
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-300 dark:border-orange-700',
      textColor: 'text-orange-900 dark:text-orange-100',
      iconColor: 'text-orange-600 dark:text-orange-400',
      icon: ShieldAlert,
      title: '⚠️ HIGH RISK: Likely Phishing Email',
    },
    medium: {
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-300 dark:border-amber-700',
      textColor: 'text-amber-900 dark:text-amber-100',
      iconColor: 'text-amber-600 dark:text-amber-400',
      icon: AlertTriangle,
      title: '⚠️ CAUTION: Suspicious Email',
    },
    low: {
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-300 dark:border-yellow-700',
      textColor: 'text-yellow-900 dark:text-yellow-100',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      icon: Info,
      title: 'ℹ️ LOW RISK: Some Suspicious Indicators',
    },
    safe: {
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-300 dark:border-green-700',
      textColor: 'text-green-900 dark:text-green-100',
      iconColor: 'text-green-600 dark:text-green-400',
      icon: Shield,
      title: '✓ This email appears safe',
    },
  };

  const config = riskConfig[riskLevel];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'mb-4 p-4 rounded-lg border-2 shadow-md',
        config.bgColor,
        config.borderColor
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-6 w-6', config.iconColor)} />
          <div>
            <h4 className={cn('text-sm font-bold', config.textColor)}>
              {config.title}
            </h4>
            <p className={cn('text-xs mt-0.5', config.textColor)}>
              Confidence: {confidence}% | Recommendation:{' '}
              {recommendation.toUpperCase()}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className={cn(
            'hover:opacity-70 transition-opacity',
            config.iconColor
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main Warnings */}
      <div className={cn('text-sm mb-3', config.textColor)}>
        <p className="font-semibold mb-1">Why this email is suspicious:</p>
        <ul className="list-disc list-inside text-xs space-y-0.5 ml-2">
          {reasons.slice(0, 3).map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
          {reasons.length > 3 && !showDetails && (
            <li className="italic">...and {reasons.length - 3} more reasons</li>
          )}
        </ul>
      </div>

      {/* Indicators */}
      {indicators.length > 0 && (
        <div
          className={cn(
            'text-xs mb-3 p-2 rounded bg-white dark:bg-gray-800',
            config.textColor
          )}
        >
          <p className="font-semibold mb-1">
            Detected Indicators ({indicators.length}):
          </p>
          <div className="space-y-1">
            {indicators
              .slice(0, showDetails ? indicators.length : 3)
              .map((indicator, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className={getSeverityBadge(indicator.severity)}>
                    {indicator.severity.toUpperCase()}
                  </span>
                  <span className="flex-1">{indicator.description}</span>
                </div>
              ))}
          </div>
          {indicators.length > 3 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={cn('mt-2 text-xs underline', config.textColor)}
            >
              {showDetails ? 'Show Less' : `Show ${indicators.length - 3} More`}
            </button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {recommendation === 'delete' && onDelete && (
          <button
            onClick={onDelete}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded flex items-center gap-1 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Delete Email
          </button>
        )}
        {recommendation === 'quarantine' && onQuarantine && (
          <button
            onClick={onQuarantine}
            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded flex items-center gap-1 transition-colors"
          >
            <Ban className="h-3 w-3" />
            Quarantine
          </button>
        )}
        {recommendation === 'caution' && (
          <div className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 text-sm font-medium rounded">
            ⚠️ Proceed with extreme caution
          </div>
        )}
        <button
          onClick={() => setIsDismissed(true)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded transition-colors border',
            config.textColor,
            config.borderColor,
            'hover:opacity-80'
          )}
        >
          I Understand the Risks
        </button>
      </div>

      {/* Safety Tips */}
      {riskLevel === 'critical' ||
        (riskLevel === 'high' && (
          <div
            className="mt-3 pt-3 border-t"
            style={{ borderColor: config.borderColor.replace('border-', '') }}
          >
            <p className={cn('text-xs font-semibold mb-1', config.textColor)}>
              🛡️ Safety Tips:
            </p>
            <ul
              className={cn(
                'text-xs space-y-0.5 ml-4 list-disc',
                config.textColor
              )}
            >
              <li>Do not click any links in this email</li>
              <li>Do not download or open attachments</li>
              <li>Do not reply with personal information</li>
              <li>Report this to your IT department if work-related</li>
              <li>
                If claiming to be from a company, contact them directly using
                official channels
              </li>
            </ul>
          </div>
        ))}
    </div>
  );
}

function getSeverityBadge(severity: string): string {
  const badges = {
    high: 'px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded',
    medium:
      'px-1.5 py-0.5 bg-amber-600 text-white text-[10px] font-bold rounded',
    low: 'px-1.5 py-0.5 bg-yellow-600 text-white text-[10px] font-bold rounded',
  };
  return badges[severity as keyof typeof badges] || badges.low;
}
