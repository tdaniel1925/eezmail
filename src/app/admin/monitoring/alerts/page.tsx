'use client';

/**
 * Alert Rules Configuration Page
 * Create and manage alert rules visually
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertRulesTable } from '@/components/admin/AlertRulesTable';
import { Button } from '@/components/ui/button';
import { Plus, Shield } from 'lucide-react';

export default function AlertRulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    enabled: 0,
    critical: 0,
    triggered: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRules() {
      try {
        const response = await fetch('/api/admin/monitoring/alerts');
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          if (response.status === 403) {
            router.push('/dashboard');
            return;
          }
          throw new Error('Failed to load alert rules');
        }
        const data = await response.json();
        setRules(data.rules || []);
        setStats(data.stats || stats);
      } catch (error) {
        console.error('Error loading alert rules:', error);
      } finally {
        setLoading(false);
      }
    }
    loadRules();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-3 border border-blue-500/20">
              <Shield className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Alert Rules</h1>
              <p className="text-sm text-gray-400">
                Configure automated alerting thresholds
              </p>
            </div>
          </div>

          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => router.push('/admin/monitoring/alerts/new')}
          >
            <Plus className="h-4 w-4" />
            Create Rule
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6">
            <p className="text-sm text-gray-400">Total Rules</p>
            <p className="text-3xl font-bold text-white mt-2">
              {loading ? '-' : stats.total}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6">
            <p className="text-sm text-gray-400">Enabled</p>
            <p className="text-3xl font-bold text-green-400 mt-2">
              {loading ? '-' : stats.enabled}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6">
            <p className="text-sm text-gray-400">Critical Level</p>
            <p className="text-3xl font-bold text-red-400 mt-2">
              {loading ? '-' : stats.critical}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6">
            <p className="text-sm text-gray-400">Recently Triggered</p>
            <p className="text-3xl font-bold text-orange-400 mt-2">
              {loading ? '-' : stats.triggered}
            </p>
          </div>
        </div>

        {/* Alert Rules Table */}
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading rules...</div>
        ) : (
          <AlertRulesTable rules={rules} />
        )}
      </div>
    </div>
  );
}
