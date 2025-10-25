'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Star,
  Clock,
  AlertTriangle,
  Calendar,
  MessageCircle,
  ChevronRight,
  Check,
  Bell,
  BellOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ProactiveAlert } from '@/db/schema';

interface ProactiveSuggestionsProps {
  className?: string;
}

export function ProactiveSuggestions({ className }: ProactiveSuggestionsProps) {
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [counts, setCounts] = useState({
    total: 0,
    undismissed: 0,
  });

  // Fetch alerts
  useEffect(() => {
    async function loadAlerts() {
      try {
        const response = await fetch('/api/proactive-alerts?limit=10');
        const data = await response.json();

        if (data.success) {
          setAlerts(data.alerts || []);
          setCounts({
            total: data.counts?.total || 0,
            undismissed: data.counts?.undismissed || 0,
          });
        }
      } catch (error) {
        console.error('Error loading proactive alerts:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAlerts();

    // Poll for new alerts every 30 seconds
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Dismiss alert
  const handleDismiss = async (alertId: string, actedUpon: boolean = false) => {
    try {
      const response = await fetch('/api/proactive-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, actedUpon }),
      });

      if (response.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
        setCounts((prev) => ({
          ...prev,
          undismissed: prev.undismissed - 1,
        }));
        toast.success('Alert dismissed');
      }
    } catch (error) {
      console.error('Error dismissing alert:', error);
      toast.error('Failed to dismiss alert');
    }
  };

  // Dismiss all alerts
  const handleDismissAll = async () => {
    try {
      const response = await fetch('/api/proactive-alerts', {
        method: 'DELETE',
      });

      if (response.ok) {
        setAlerts([]);
        setCounts({ total: 0, undismissed: 0 });
        toast.success('All alerts dismissed');
        setIsExpanded(false);
      }
    } catch (error) {
      console.error('Error dismissing all alerts:', error);
      toast.error('Failed to dismiss all alerts');
    }
  };

  // Navigate and mark as acted upon
  const handleAction = (alert: ProactiveAlert) => {
    if (alert.actionUrl) {
      handleDismiss(alert.id, true);
      window.location.href = alert.actionUrl;
    }
  };

  // Get icon for alert type
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'vip_email':
        return Star;
      case 'overdue_response':
        return Clock;
      case 'urgent_keyword':
        return AlertTriangle;
      case 'meeting_prep':
        return Calendar;
      case 'follow_up_needed':
        return MessageCircle;
      default:
        return Bell;
    }
  };

  // Get color for alert type
  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'medium':
        return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30';
      case 'low':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  if (isLoading) {
    return null; // Don't show while loading
  }

  if (alerts.length === 0) {
    return null; // Don't show if no alerts
  }

  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      <AnimatePresence>
        {!isExpanded ? (
          // Collapsed Badge
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <Sparkles size={20} className="animate-pulse" />
            <span className="font-semibold">
              {counts.undismissed} AI Insights
            </span>
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          </motion.button>
        ) : (
          // Expanded Panel
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-[400px] max-h-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <div className="flex items-center gap-2">
                <Sparkles
                  size={20}
                  className="text-purple-600 dark:text-purple-400"
                />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  AI Insights
                </h3>
                <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full">
                  {counts.undismissed}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {counts.undismissed > 1 && (
                  <button
                    onClick={handleDismissAll}
                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Dismiss all"
                  >
                    <BellOff size={16} />
                  </button>
                )}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Alerts List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <AnimatePresence>
                {alerts.map((alert, index) => {
                  const Icon = getAlertIcon(alert.type);
                  const colorClass = getAlertColor(alert.priority);

                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                            colorClass
                          )}
                        >
                          <Icon size={16} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                              {alert.title}
                            </h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDismiss(alert.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-all"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {alert.message}
                          </p>

                          {/* Action Button */}
                          {alert.actionUrl && alert.actionLabel && (
                            <button
                              onClick={() => handleAction(alert)}
                              className="flex items-center gap-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                            >
                              <span>{alert.actionLabel}</span>
                              <ChevronRight size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Alerts update automatically every 5 minutes
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
