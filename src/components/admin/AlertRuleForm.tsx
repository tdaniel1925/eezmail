'use client';

/**
 * Alert Rule Form Component
 * Create/edit alert rules with validation
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { METRICS } from '@/lib/monitoring/metrics-constants';

interface AlertRuleFormProps {
  initialData?: {
    id: string;
    name: string;
    metric: string;
    operator: string;
    threshold: string;
    durationMinutes: number;
    severity: string;
    enabled: boolean;
    notificationChannels: Record<string, unknown>;
  };
}

export function AlertRuleForm({ initialData }: AlertRuleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    metric: initialData?.metric || '',
    operator: initialData?.operator || 'gt',
    threshold: initialData?.threshold || '',
    durationMinutes: initialData?.durationMinutes || 5,
    severity: initialData?.severity || 'warning',
    enabled: initialData?.enabled ?? true,
    emailNotifications: '',
    slackWebhook: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const notificationChannels: Record<string, unknown> = {};
      if (formData.emailNotifications) {
        notificationChannels.email = formData.emailNotifications
          .split(',')
          .map((e) => e.trim());
      }
      if (formData.slackWebhook) {
        notificationChannels.slack = formData.slackWebhook;
      }

      const payload = {
        name: formData.name,
        metric: formData.metric,
        operator: formData.operator,
        threshold: formData.threshold,
        durationMinutes: formData.durationMinutes,
        severity: formData.severity,
        enabled: formData.enabled,
        notificationChannels,
      };

      const url = initialData
        ? `/api/admin/monitoring/alerts/rules/${initialData.id}`
        : '/api/admin/monitoring/alerts/rules';

      const response = await fetch(url, {
        method: initialData ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push('/admin/monitoring/alerts');
        router.refresh();
      } else {
        alert('Failed to save alert rule');
      }
    } catch (error) {
      console.error('Error saving alert rule:', error);
      alert('Failed to save alert rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const metricOptions = Object.entries(METRICS).map(([key, value]) => ({
    label: key.replace(/_/g, ' '),
    value,
  }));

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border bg-white p-8 space-y-6"
    >
      {/* Rule Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Rule Name *</Label>
        <Input
          id="name"
          required
          placeholder="High API Latency"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <p className="text-xs text-gray-500">
          A descriptive name for this alert rule
        </p>
      </div>

      {/* Metric */}
      <div className="space-y-2">
        <Label htmlFor="metric">Metric *</Label>
        <Select
          value={formData.metric}
          onValueChange={(value) => setFormData({ ...formData, metric: value })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select metric" />
          </SelectTrigger>
          <SelectContent>
            {metricOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Condition */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="operator">Operator *</Label>
          <Select
            value={formData.operator}
            onValueChange={(value) =>
              setFormData({ ...formData, operator: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gt">Greater than (&gt;)</SelectItem>
              <SelectItem value="lt">Less than (&lt;)</SelectItem>
              <SelectItem value="eq">Equal to (=)</SelectItem>
              <SelectItem value="gte">Greater or equal (≥)</SelectItem>
              <SelectItem value="lte">Less or equal (≤)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="threshold">Threshold *</Label>
          <Input
            id="threshold"
            type="number"
            step="any"
            required
            placeholder="500"
            value={formData.threshold}
            onChange={(e) =>
              setFormData({ ...formData, threshold: e.target.value })
            }
          />
        </div>
      </div>

      {/* Duration & Severity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min="1"
            placeholder="5"
            value={formData.durationMinutes}
            onChange={(e) =>
              setFormData({
                ...formData,
                durationMinutes: parseInt(e.target.value),
              })
            }
          />
          <p className="text-xs text-gray-500">
            Alert triggers if condition persists
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="severity">Severity *</Label>
          <Select
            value={formData.severity}
            onValueChange={(value) =>
              setFormData({ ...formData, severity: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notification Channels */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold">Notification Channels</h3>

        <div className="space-y-2">
          <Label htmlFor="email">Email Addresses</Label>
          <Input
            id="email"
            type="text"
            placeholder="admin@example.com, ops@example.com"
            value={formData.emailNotifications}
            onChange={(e) =>
              setFormData({ ...formData, emailNotifications: e.target.value })
            }
          />
          <p className="text-xs text-gray-500">
            Comma-separated email addresses
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="slack">Slack Webhook URL</Label>
          <Input
            id="slack"
            type="url"
            placeholder="https://hooks.slack.com/services/..."
            value={formData.slackWebhook}
            onChange={(e) =>
              setFormData({ ...formData, slackWebhook: e.target.value })
            }
          />
        </div>
      </div>

      {/* Enabled Toggle */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          <Label htmlFor="enabled">Enable Rule</Label>
          <p className="text-sm text-gray-500">
            Start monitoring this rule immediately
          </p>
        </div>
        <Switch
          id="enabled"
          checked={formData.enabled}
          onCheckedChange={(enabled) => setFormData({ ...formData, enabled })}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting
            ? 'Saving...'
            : initialData
              ? 'Update Rule'
              : 'Create Rule'}
        </Button>
      </div>
    </form>
  );
}
