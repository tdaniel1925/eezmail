'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  Edit,
  Trash2,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Folder,
  Tag,
  Archive,
} from 'lucide-react';

interface Rule {
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

interface RuleCardProps {
  rule: Rule;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function RuleCard({ rule, onToggle, onEdit, onDelete }: RuleCardProps) {
  // Parse conditions to display
  const getConditionSummary = () => {
    if (!rule.conditions) return 'No conditions';
    
    const conditions = [];
    if (rule.conditions.from) conditions.push(`From: ${rule.conditions.from}`);
    if (rule.conditions.subject) conditions.push(`Subject contains: "${rule.conditions.subject}"`);
    if (rule.conditions.category) conditions.push(`Category: ${rule.conditions.category}`);
    if (rule.conditions.hasAttachment) conditions.push('Has attachment');
    
    return conditions.length > 0 ? conditions.join(' AND ') : 'Any email';
  };

  // Parse actions to display
  const getActionSummary = () => {
    if (!rule.actions) return 'No actions';
    
    const actions = [];
    if (rule.actions.moveToFolder) actions.push(`Move to: ${rule.actions.moveToFolder}`);
    if (rule.actions.addLabel) actions.push(`Label: ${rule.actions.addLabel}`);
    if (rule.actions.markAs) actions.push(`Mark as: ${rule.actions.markAs}`);
    if (rule.actions.archive) actions.push('Archive');
    if (rule.actions.delete) actions.push('Delete');
    if (rule.actions.forward) actions.push(`Forward to: ${rule.actions.forward}`);
    
    return actions.length > 0 ? actions.join(', ') : 'No actions';
  };

  const getActionIcon = () => {
    if (rule.actions?.moveToFolder) return <Folder className="h-4 w-4" />;
    if (rule.actions?.addLabel) return <Tag className="h-4 w-4" />;
    if (rule.actions?.archive) return <Archive className="h-4 w-4" />;
    if (rule.actions?.forward) return <Mail className="h-4 w-4" />;
    return <Mail className="h-4 w-4" />;
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30">
              {getActionIcon()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {rule.name}
                </h3>
                {rule.enabled ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                    Paused
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Created {new Date(rule.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Condition Summary */}
          <div className="mb-3 pl-13">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                WHEN
              </p>
              <p className="text-sm text-blue-900 dark:text-blue-100">
                {getConditionSummary()}
              </p>
            </div>
          </div>

          {/* Action Summary */}
          <div className="mb-4 pl-13">
            <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-3">
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-1">
                THEN
              </p>
              <p className="text-sm text-purple-900 dark:text-purple-100">
                {getActionSummary()}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 pl-13">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>{rule.executionCount} executions</span>
            </div>
            <div className="flex items-center gap-2">
              {rule.successRate >= 90 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : rule.successRate >= 70 ? (
                <CheckCircle className="h-4 w-4 text-yellow-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span>{rule.successRate}% success</span>
            </div>
            {rule.lastExecuted && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  Last: {new Date(rule.lastExecuted).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(!rule.enabled)}
            title={rule.enabled ? 'Pause rule' : 'Activate rule'}
          >
            {rule.enabled ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit} title="Edit rule">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            title="Delete rule"
            className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}


