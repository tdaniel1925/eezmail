'use client';

/**
 * Alert Rules Table Component
 * Display and manage alert rules
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Trash2, TestTube, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AlertRulesTableProps {
  rules: Array<{
    id: string;
    name: string;
    metric: string;
    operator: string;
    threshold: string;
    severity: string;
    enabled: boolean;
    lastTriggeredAt: Date | null;
    createdAt: Date;
  }>;
}

export function AlertRulesTable({ rules }: AlertRulesTableProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    setUpdating(ruleId);
    try {
      await fetch(`/api/admin/monitoring/alerts/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    } finally {
      setUpdating(null);
    }
  };

  const testRule = async (ruleId: string) => {
    try {
      await fetch(`/api/admin/monitoring/alerts/rules/${ruleId}/test`, {
        method: 'POST',
      });
      alert('Test alert sent!');
    } catch (error) {
      console.error('Failed to test rule:', error);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this alert rule?')) return;

    try {
      await fetch(`/api/admin/monitoring/alerts/rules/${ruleId}`, {
        method: 'DELETE',
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to delete rule:', error);
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

  const getOperatorText = (operator: string) => {
    const map: Record<string, string> = {
      gt: '>',
      lt: '<',
      eq: '=',
      gte: '≥',
      lte: '≤',
    };
    return map[operator] || operator;
  };

  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Rule Name</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Triggered</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No alert rules configured. Create your first rule!
              </TableCell>
            </TableRow>
          ) : (
            rules.map((rule) => (
              <TableRow key={rule.id} className="hover:bg-gray-50">
                <TableCell>
                  <div>
                    <div className="font-medium">{rule.name}</div>
                    <div className="text-sm text-gray-500">{rule.metric}</div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {getOperatorText(rule.operator)} {rule.threshold}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={getSeverityBadge(rule.severity)}
                  >
                    {rule.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(enabled) => toggleRule(rule.id, enabled)}
                    disabled={updating === rule.id}
                  />
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {rule.lastTriggeredAt ? (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                      {formatDistanceToNow(new Date(rule.lastTriggeredAt), {
                        addSuffix: true,
                      })}
                    </div>
                  ) : (
                    <span className="text-gray-400">Never</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => testRule(rule.id)}
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/admin/monitoring/alerts/${rule.id}/edit`)
                      }
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
