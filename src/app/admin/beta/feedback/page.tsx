'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquare, Star, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Feedback {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  rating: number | null;
  sentiment: string | null;
  tags: string[] | null;
  priority: string | null;
  status: string;
  createdAt: string;
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const response = await fetch('/api/beta/feedback');
      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback || []);
      }
    } catch (error) {
      toast.error('Failed to load feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (feedbackId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/beta/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId, status: newStatus }),
      });

      if (response.ok) {
        toast.success('Status updated');
        fetchFeedback();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredFeedback = feedback.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Feedback Dashboard</h1>
        <p className="text-muted-foreground">Review and manage beta user feedback</p>
      </div>

      <div className="mb-6 flex gap-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="feature_request">Feature Requests</SelectItem>
            <SelectItem value="bug_report">Bug Reports</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="implemented">Implemented</SelectItem>
            <SelectItem value="wont_fix">Won't Fix</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center">Loading feedback...</div>
      ) : filteredFeedback.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No feedback yet</h3>
            <p className="text-muted-foreground">Feedback will appear here when beta users submit it</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFeedback.map((item) => (
            <FeedbackCard
              key={item.id}
              feedback={item}
              onStatusChange={(newStatus) => updateStatus(item.id, newStatus)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedbackCard({
  feedback,
  onStatusChange,
}: {
  feedback: Feedback;
  onStatusChange: (status: string) => void;
}) {
  const sentimentColor = {
    positive: 'bg-green-100 text-green-800',
    neutral: 'bg-gray-100 text-gray-800',
    negative: 'bg-red-100 text-red-800',
  };

  const priorityColor = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  const statusColor = {
    new: 'bg-purple-100 text-purple-800',
    reviewing: 'bg-yellow-100 text-yellow-800',
    implemented: 'bg-green-100 text-green-800',
    wont_fix: 'bg-gray-100 text-gray-800',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {feedback.title}
              {feedback.priority && (
                <Badge className={priorityColor[feedback.priority as keyof typeof priorityColor]}>
                  {feedback.priority}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-2">{feedback.description}</CardDescription>
          </div>
          <Select
            value={feedback.status}
            onValueChange={onStatusChange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="implemented">Implemented</SelectItem>
              <SelectItem value="wont_fix">Won't Fix</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{feedback.type.replace('_', ' ')}</Badge>

          {feedback.sentiment && (
            <Badge className={sentimentColor[feedback.sentiment as keyof typeof sentimentColor]}>
              {feedback.sentiment}
            </Badge>
          )}

          {feedback.rating && (
            <div className="flex items-center">
              {Array.from({ length: feedback.rating }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          )}

          {feedback.tags && feedback.tags.length > 0 && (
            <>
              {feedback.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </>
          )}

          <span className="ml-auto text-xs text-muted-foreground">
            {new Date(feedback.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

