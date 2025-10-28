'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Sparkles, TrendingUp, AlertCircle, CheckCircle2, Brain } from 'lucide-react';
import { toast } from 'sonner';

interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: string;
  impactScore: number;
  effortEstimate: string;
  relatedFeedbackIds: string[] | null;
  suggestedSolution: string | null;
  status: string;
  generatedByAi: boolean;
  createdAt: string;
}

export default function InsightsPage() {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchActionItems();
  }, []);

  const fetchActionItems = async () => {
    try {
      const response = await fetch('/api/beta/action-items');
      if (response.ok) {
        const data = await response.json();
        setActionItems(data.actionItems || []);
      }
    } catch (error) {
      toast.error('Failed to load action items');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewItems = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/beta/generate-insights', {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('AI insights generated successfully!');
        fetchActionItems();
      } else {
        toast.error('Failed to generate insights');
      }
    } catch (error) {
      toast.error('Failed to generate insights');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/beta/action-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (response.ok) {
        toast.success('Status updated');
        fetchActionItems();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const priorityGroups = {
    high: actionItems.filter((item) => item.priority === 'high'),
    medium: actionItems.filter((item) => item.priority === 'medium'),
    low: actionItems.filter((item) => item.priority === 'low'),
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            AI Insights
          </h1>
          <p className="text-muted-foreground">
            AI-generated action items based on beta user feedback
          </p>
        </div>
        <Button onClick={generateNewItems} disabled={isGenerating}>
          <Sparkles className="mr-2 h-4 w-4" />
          {isGenerating ? 'Generating...' : 'Generate New Insights'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{priorityGroups.high.length}</div>
            <p className="text-xs text-muted-foreground">Critical action items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Target className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {actionItems.filter((item) => item.status === 'in_progress').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {actionItems.filter((item) => item.status === 'done').length}
            </div>
            <p className="text-xs text-muted-foreground">Implemented features</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center">Loading insights...</div>
      ) : actionItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No insights yet</h3>
            <p className="text-muted-foreground mb-4">
              Generate AI insights from beta user feedback
            </p>
            <Button onClick={generateNewItems} disabled={isGenerating}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Insights
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {['high', 'medium', 'low'].map((priority) => {
            const items = priorityGroups[priority as keyof typeof priorityGroups];
            if (items.length === 0) return null;

            return (
              <div key={priority}>
                <h2 className="mb-4 text-xl font-semibold capitalize">
                  {priority} Priority
                  <Badge className="ml-2" variant="outline">
                    {items.length}
                  </Badge>
                </h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <ActionItemCard
                      key={item.id}
                      item={item}
                      onStatusChange={(newStatus) => updateStatus(item.id, newStatus)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActionItemCard({
  item,
  onStatusChange,
}: {
  item: ActionItem;
  onStatusChange: (status: string) => void;
}) {
  const priorityColor = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  const effortColor = {
    small: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    large: 'bg-red-100 text-red-800',
  };

  const statusButtons = [
    { value: 'todo', label: 'To Do', icon: Target },
    { value: 'in_progress', label: 'In Progress', icon: TrendingUp },
    { value: 'done', label: 'Done', icon: CheckCircle2 },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {item.title}
              {item.generatedByAi && (
                <Badge variant="secondary">
                  <Sparkles className="mr-1 h-3 w-3" />
                  AI
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-2">{item.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={priorityColor[item.priority as keyof typeof priorityColor]}>
            {item.priority} priority
          </Badge>
          <Badge className={effortColor[item.effortEstimate as keyof typeof effortColor]}>
            {item.effortEstimate} effort
          </Badge>
          <Badge variant="outline">Impact: {item.impactScore}/10</Badge>
          {item.relatedFeedbackIds && item.relatedFeedbackIds.length > 0 && (
            <Badge variant="outline">
              {item.relatedFeedbackIds.length} related feedback
            </Badge>
          )}
        </div>

        {item.suggestedSolution && (
          <div className="rounded-lg bg-secondary p-3">
            <p className="text-sm font-medium">Suggested Solution:</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.suggestedSolution}</p>
          </div>
        )}

        <div className="flex gap-2">
          {statusButtons.map((btn) => {
            const Icon = btn.icon;
            return (
              <Button
                key={btn.value}
                variant={item.status === btn.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onStatusChange(btn.value)}
              >
                <Icon className="mr-1 h-4 w-4" />
                {btn.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

