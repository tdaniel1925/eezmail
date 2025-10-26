'use client';

/**
 * Active Alerts Component
 * Displays currently active system alerts
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActiveAlertsProps {
  alerts: Array<{
    alert: {
      id: string;
      severity: string;
      message: string;
      triggeredAt: Date;
      resolvedAt: Date | null;
    };
    rule: {
      name: string;
      metric: string;
    } | null;
  }>;
}

export function ActiveAlerts({ alerts }: ActiveAlertsProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      critical: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      info: 'bg-blue-100 text-blue-800',
    };
    return variants[severity as keyof typeof variants] || variants.info;
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch(`/api/admin/monitoring/alerts/${alertId}/resolve`, {
        method: 'POST',
      });
      window.location.reload();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Active Alerts</h2>
        {alerts.length > 0 && (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            {alerts.length} Active
          </Badge>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-500">
            No active alerts. System running smoothly!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(({ alert, rule }) => (
            <div
              key={alert.id}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {rule?.name || 'Unknown Rule'}
                      </span>
                      <Badge
                        variant="secondary"
                        className={getSeverityBadge(alert.severity)}
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Metric: {rule?.metric || 'N/A'}</span>
                      <span>
                        Triggered{' '}
                        {formatDistanceToNow(new Date(alert.triggeredAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resolveAlert(alert.id)}
                >
                  Resolve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
