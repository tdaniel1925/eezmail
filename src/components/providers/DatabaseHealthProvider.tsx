'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface DatabaseHealthReport {
  isHealthy: boolean;
  score: number;
  issues: string[];
  recommendations: string[];
  timestamp: string;
  autoRepair?: {
    attempted: boolean;
    success: boolean;
    message: string;
  };
}

interface DatabaseHealthProviderProps {
  children: React.ReactNode;
}

export function DatabaseHealthProvider({
  children,
}: DatabaseHealthProviderProps) {
  const [healthReport, setHealthReport] = useState<DatabaseHealthReport | null>(
    null
  );
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const runHealthCheck = async () => {
      try {
        setIsChecking(true);
        const response = await fetch('/api/health/database', {
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });
        const report = await response.json();
        setHealthReport(report);

        // Show warnings for critical issues
        if (!report.isHealthy) {
          if (report.score < 50) {
            toast.error('Critical database issues detected!', {
              description:
                'Some features may not work. Check the dev tools dashboard.',
              duration: 10000,
            });
          } else if (report.score < 80) {
            toast.warning('Database health issues detected', {
              description: 'Run database migration to fix issues.',
              duration: 8000,
            });
          }
        }

        // Show auto-repair results
        if (report.autoRepair?.attempted) {
          if (report.autoRepair.success) {
            toast.success('Database auto-repair completed', {
              description: report.autoRepair.message,
            });
          } else {
            console.warn('Auto-repair failed:', report.autoRepair.message);
          }
        }
      } catch (error) {
        console.error('Database health check failed:', error);
        // Don't show error toast for timeout/network issues
        if (
          !error.name?.includes('AbortError') &&
          !error.message?.includes('timeout')
        ) {
          toast.error('Database health check failed', {
            description: 'Check console for details.',
          });
        }
      } finally {
        setIsChecking(false);
      }
    };

    // Run health check in background after a short delay
    const timeoutId = setTimeout(runHealthCheck, 2000);

    // Run periodic health checks every 5 minutes
    const interval = setInterval(runHealthCheck, 5 * 60 * 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, []);

  // Store health report in localStorage for dev tools dashboard
  useEffect(() => {
    if (healthReport) {
      localStorage.setItem(
        'db-health-report',
        JSON.stringify({
          ...healthReport,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }, [healthReport]);

  return (
    <>
      {children}
      {/* Health status indicator (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50">
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              isChecking
                ? 'bg-yellow-100 text-yellow-800'
                : healthReport?.isHealthy
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
            }`}
          >
            {isChecking
              ? 'Checking DB...'
              : healthReport?.isHealthy
                ? `DB: ${healthReport.score}/100`
                : `DB: ${healthReport?.score || 0}/100`}
          </div>
        </div>
      )}
    </>
  );
}
