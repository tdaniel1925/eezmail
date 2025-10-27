'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AutoAssignButtonProps {
  ticketId?: string;
  ticketIds?: string[];
  onAssigned?: () => void;
}

type AssignmentStrategyType =
  | 'round_robin'
  | 'load_balance'
  | 'category_based'
  | 'expertise';

export function AutoAssignButton({
  ticketId,
  ticketIds,
  onAssigned,
}: AutoAssignButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [strategy, setStrategy] =
    useState<AssignmentStrategyType>('load_balance');
  const { toast } = useToast();

  const isBulk = ticketIds && ticketIds.length > 0;
  const targetCount = isBulk ? ticketIds.length : 1;

  const handleAutoAssign = async () => {
    setIsLoading(true);

    try {
      let response: Response;

      if (isBulk) {
        response = await fetch('/api/admin/support/tickets/bulk-assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketIds,
            strategy: { type: strategy },
          }),
        });
      } else {
        response = await fetch(
          `/api/admin/support/tickets/${ticketId}/auto-assign`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              strategy: { type: strategy },
            }),
          }
        );
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to auto-assign');
      }

      const result = await response.json();

      if (isBulk) {
        toast({
          title: 'Bulk Assignment Complete',
          description: `Successfully assigned ${result.successful} of ${targetCount} tickets`,
        });
      } else if (result.success) {
        toast({
          title: 'Ticket Assigned',
          description: result.reason,
        });
      } else {
        throw new Error(result.reason);
      }

      setIsOpen(false);
      onAssigned?.();
    } catch (error: any) {
      toast({
        title: 'Assignment Failed',
        description: error.message || 'Failed to auto-assign ticket(s)',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <span className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span>Auto-Assign {isBulk && `(${targetCount})`}</span>
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Auto-Assign Ticket{isBulk && 's'}</DialogTitle>
          <DialogDescription>
            {isBulk
              ? `Automatically assign ${targetCount} tickets to available support agents using the selected strategy.`
              : 'Automatically assign this ticket to an available support agent using the selected strategy.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Assignment Strategy</label>
            <Select
              value={strategy}
              onValueChange={(value) =>
                setStrategy(value as AssignmentStrategyType)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="round_robin">
                  <div>
                    <div className="font-medium">Round Robin</div>
                    <div className="text-xs text-muted-foreground">
                      Assign to agent with least recent assignment
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="load_balance">
                  <div>
                    <div className="font-medium">Load Balance</div>
                    <div className="text-xs text-muted-foreground">
                      Assign to agent with fewest open tickets
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="category_based">
                  <div>
                    <div className="font-medium">Category-Based</div>
                    <div className="text-xs text-muted-foreground">
                      Assign to agents specializing in ticket category
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="expertise">
                  <div>
                    <div className="font-medium">Expertise Match</div>
                    <div className="text-xs text-muted-foreground">
                      Match agent skill level to ticket priority
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              {strategy === 'round_robin' && (
                <>
                  <li>Finds all available support agents</li>
                  <li>Assigns to agent with oldest last assignment</li>
                  <li>Ensures fair distribution over time</li>
                </>
              )}
              {strategy === 'load_balance' && (
                <>
                  <li>Counts open tickets for each agent</li>
                  <li>Assigns to agent with fewest open tickets</li>
                  <li>Prevents overloading individual agents</li>
                </>
              )}
              {strategy === 'category_based' && (
                <>
                  <li>Matches ticket category to agent specialties</li>
                  <li>Falls back to round-robin if no specialist found</li>
                  <li>Improves resolution quality</li>
                </>
              )}
              {strategy === 'expertise' && (
                <>
                  <li>Matches agent seniority to ticket priority</li>
                  <li>High/critical tickets go to senior agents</li>
                  <li>Considers category specialization</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleAutoAssign} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Auto-Assign {isBulk && `${targetCount} Tickets`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
