/**
 * Create New Support Ticket Page
 * Form for creating a new support ticket
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Send } from 'lucide-react';
import { InlineNotification } from '@/components/ui/inline-notification';

export default function NewTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'normal',
    category: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    try {
      const response = await fetch('/api/admin/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create ticket');
      }

      const ticket = await response.json();
      setNotification({
        type: 'success',
        message: 'Ticket created successfully!',
      });

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/admin/support/${ticket.id}`);
      }, 1000);
    } catch (error) {
      console.error('Error creating ticket:', error);
      setNotification({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Failed to create ticket',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {notification && (
          <InlineNotification
            type={notification.type}
            message={notification.message}
            onDismiss={() => setNotification(null)}
          />
        )}

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/support')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Create New Ticket
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Submit a new support request
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 p-6 space-y-6"
        >
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              placeholder="Brief description of the issue"
              required
              minLength={3}
              maxLength={500}
              className="dark:bg-gray-900"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detailed description of the issue..."
              required
              minLength={10}
              rows={8}
              className="dark:bg-gray-900"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formData.description.length} characters
            </p>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority *</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                setFormData({ ...formData, priority: value })
              }
            >
              <SelectTrigger className="dark:bg-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category (Optional)</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              placeholder="e.g., Technical Issue, Billing, Feature Request"
              className="dark:bg-gray-900"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4 border-t dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/support')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Create Ticket
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
