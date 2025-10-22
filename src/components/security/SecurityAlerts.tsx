'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  PrivacyScanResult,
  SensitiveDataMatch,
} from '@/lib/security/privacy-scanner';

interface SecurityAlertsProps {
  text: string;
  onTextChange?: (maskedText: string) => void;
  enabled?: boolean;
}

export function SecurityAlerts({
  text,
  onTextChange,
  enabled = true,
}: SecurityAlertsProps): JSX.Element | null {
  const [scanResult, setScanResult] = useState<PrivacyScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Scan text when it changes (debounced)
  useEffect(() => {
    if (!enabled || !text || text.trim().length < 20) {
      setScanResult(null);
      return;
    }

    const timer = setTimeout(() => {
      scanText(text);
    }, 1500); // Scan after 1.5 seconds of inactivity

    return () => clearTimeout(timer);
  }, [text, enabled]);

  const scanText = async (textToScan: string) => {
    setIsScanning(true);
    setIsDismissed(false);

    try {
      const response = await fetch('/api/security/scan-privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToScan }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setScanResult(data.result);
        }
      }
    } catch (error) {
      console.error('Privacy scan error:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleRemoveSensitiveData = async () => {
    if (!scanResult || !onTextChange) return;

    try {
      const response = await fetch('/api/security/mask-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          matches: scanResult.matches,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          onTextChange(data.maskedText);
          setIsDismissed(true);
        }
      }
    } catch (error) {
      console.error('Mask data error:', error);
    }
  };

  if (!enabled || isDismissed) {
    return null;
  }

  if (isScanning) {
    return (
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg flex items-center gap-2">
        <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse" />
        <span className="text-sm text-blue-800 dark:text-blue-200">
          Scanning for sensitive data...
        </span>
      </div>
    );
  }

  if (!scanResult || !scanResult.hasSensitiveData) {
    return null;
  }

  const { riskLevel, warnings, matches, recommendation } = scanResult;

  // Determine alert styling based on risk level
  const riskConfig = {
    critical: {
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-300 dark:border-red-700',
      textColor: 'text-red-900 dark:text-red-100',
      iconColor: 'text-red-600 dark:text-red-400',
      icon: ShieldAlert,
    },
    high: {
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-300 dark:border-orange-700',
      textColor: 'text-orange-900 dark:text-orange-100',
      iconColor: 'text-orange-600 dark:text-orange-400',
      icon: ShieldAlert,
    },
    medium: {
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-300 dark:border-amber-700',
      textColor: 'text-amber-900 dark:text-amber-100',
      iconColor: 'text-amber-600 dark:text-amber-400',
      icon: AlertTriangle,
    },
    low: {
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-300 dark:border-yellow-700',
      textColor: 'text-yellow-900 dark:text-yellow-100',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      icon: AlertTriangle,
    },
    safe: {
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-300 dark:border-green-700',
      textColor: 'text-green-900 dark:text-green-100',
      iconColor: 'text-green-600 dark:text-green-400',
      icon: ShieldCheck,
    },
  };

  const config = riskConfig[riskLevel];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'mb-4 p-4 rounded-lg border-2',
        config.bgColor,
        config.borderColor
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-5 w-5', config.iconColor)} />
          <div>
            <h4 className={cn('text-sm font-bold', config.textColor)}>
              Security Alert: Sensitive Data Detected
            </h4>
            <p className={cn('text-xs mt-0.5', config.textColor)}>
              {warnings[0] ||
                'Your email contains potentially sensitive information'}
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

      {/* Found Items Summary */}
      <div className={cn('text-sm mb-3 space-y-1', config.textColor)}>
        <p className="font-semibold">
          Found {matches.length} sensitive item(s):
        </p>
        <ul className="list-disc list-inside text-xs space-y-0.5 ml-2">
          {matches.slice(0, 3).map((match, index) => (
            <li key={index}>
              <span className="font-medium capitalize">
                {match.type.replace('_', ' ')}:
              </span>{' '}
              {match.value}
            </li>
          ))}
          {matches.length > 3 && (
            <li className="italic">...and {matches.length - 3} more</li>
          )}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {recommendation === 'remove' && (
          <button
            onClick={handleRemoveSensitiveData}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
          >
            Remove Sensitive Data
          </button>
        )}
        {recommendation === 'encrypt' && (
          <button className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded transition-colors">
            Use Secure Link Instead
          </button>
        )}
        {(recommendation === 'review' || recommendation === 'encrypt') && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded transition-colors border',
              config.textColor,
              config.borderColor,
              'hover:opacity-80'
            )}
          >
            {showDetails ? (
              <>
                <EyeOff className="inline h-3 w-3 mr-1" /> Hide
              </>
            ) : (
              <>
                <Eye className="inline h-3 w-3 mr-1" /> Show
              </>
            )}{' '}
            Details
          </button>
        )}
        <button
          onClick={() => setIsDismissed(true)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded transition-colors',
            config.textColor,
            'hover:opacity-80'
          )}
        >
          I Understand, Send Anyway
        </button>
      </div>

      {/* Detailed Breakdown (Expandable) */}
      {showDetails && (
        <div
          className="mt-4 pt-4 border-t space-y-2"
          style={{ borderColor: config.borderColor.replace('border-', '') }}
        >
          <h5 className={cn('text-xs font-bold', config.textColor)}>
            Detailed Security Analysis:
          </h5>
          {matches.map((match, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded p-2 text-xs border"
              style={{ borderColor: config.borderColor.replace('border-', '') }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold capitalize">
                    {match.type.replace('_', ' ')} -{' '}
                    <span className={getSeverityColor(match.severity)}>
                      {match.severity} risk
                    </span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {match.recommendation}
                  </p>
                </div>
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  Position: {match.position.start}-{match.position.end}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'text-red-600 dark:text-red-400';
    case 'high':
      return 'text-orange-600 dark:text-orange-400';
    case 'medium':
      return 'text-amber-600 dark:text-amber-400';
    case 'low':
      return 'text-yellow-600 dark:text-yellow-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}
