'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  TrendingUp,
  CheckCircle,
  XCircle,
  Zap,
  Clock,
  Filter,
} from 'lucide-react';
import { RuleBuilder } from '@/components/autopilot/RuleBuilder';
import { RuleCard } from '@/components/autopilot/RuleCard';
import { ExecutionHistory } from '@/components/autopilot/ExecutionHistory';

interface AutopilotRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: any;
  actions: any;
  executionCount: number;
  successRate: number;
  lastExecuted?: string;
  createdAt: string;
}

interface Stats {
  totalRules: number;
  activeRules: number;
  totalExecutions: number;
  successRate: number;
}

export default function AutopilotPage() {
  const [rules, setRules] = useState<AutopilotRule[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRules: 0,
    activeRules: 0,
    totalExecutions: 0,
    successRate: 0,
  });
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<AutopilotRule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rules' | 'history'>('rules');

  // Fetch rules on mount
  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/autopilot/rules');
      if (response.ok) {
        const data = await response.json();
        setRules(data.rules || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRule = async (ruleData: any) => {
    try {
      const response = await fetch('/api/autopilot/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData),
      });

      if (response.ok) {
        await fetchRules();
        setShowRuleBuilder(false);
      }
    } catch (error) {
      console.error('Error creating rule:', error);
    }
  };

  const handleUpdateRule = async (id: string, updates: Partial<AutopilotRule>) => {
    try {
      const response = await fetch(`/api/autopilot/rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await fetchRules();
        setEditingRule(null);
      }
    } catch (error) {
      console.error('Error updating rule:', error);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const response = await fetch(`/api/autopilot/rules/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchRules();
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const handleToggleRule = async (id: string, enabled: boolean) => {
    await handleUpdateRule(id, { enabled });
  };

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Zap className="h-8 w-8 text-purple-600" />
            Email Autopilot
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Automate your email workflow with intelligent rules
          </p>
        </div>
        <Button
          onClick={() => setShowRuleBuilder(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Rules
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalRules}
              </p>
            </div>
            <Filter className="h-8 w-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Rules
              </p>
              <p className="mt-2 text-3xl font-bold text-green-600">
                {stats.activeRules}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Executions
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalExecutions.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Success Rate
              </p>
              <p className="mt-2 text-3xl font-bold text-purple-600">
                {stats.successRate}%
              </p>
            </div>
            <Zap className="h-8 w-8 text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('rules')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === 'rules'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Rules
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Execution History
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Loading rules...
              </p>
            </div>
          ) : rules.length === 0 ? (
            <Card className="p-12 text-center">
              <Zap className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                No rules yet
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Get started by creating your first automation rule
              </p>
              <Button
                onClick={() => setShowRuleBuilder(true)}
                className="mt-6 bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Rule
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onToggle={(enabled) => handleToggleRule(rule.id, enabled)}
                  onEdit={() => {
                    setEditingRule(rule);
                    setShowRuleBuilder(true);
                  }}
                  onDelete={() => handleDeleteRule(rule.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && <ExecutionHistory />}

      {/* Rule Builder Modal */}
      {showRuleBuilder && (
        <RuleBuilder
          existingRule={editingRule}
          onSave={editingRule ? 
            (data) => handleUpdateRule(editingRule.id, data) : 
            handleCreateRule
          }
          onCancel={() => {
            setShowRuleBuilder(false);
            setEditingRule(null);
          }}
        />
      )}
    </div>
  );
}


