'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  grantSMSTrialCredits,
  grantAITrialCreditsAction,
} from '@/lib/admin/platform-actions';
import { Loader2, MessageSquare, Brain } from 'lucide-react';

export default function TrialCreditsForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [customerType, setCustomerType] = useState<'organization' | 'user'>(
    'user'
  );
  const [smsAmount, setSmsAmount] = useState('5.00');
  const [aiAmount, setAiAmount] = useState('10.00');
  const [aiTokens, setAiTokens] = useState('5000');
  const [durationDays, setDurationDays] = useState('30');
  const [reason, setReason] = useState('');
  const [grantType, setGrantType] = useState<'both' | 'sms' | 'ai'>('both');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!customerId.trim()) {
        toast.error('Please enter a customer ID');
        return;
      }

      const duration = parseInt(durationDays);

      // Grant SMS trial
      if (grantType === 'both' || grantType === 'sms') {
        const smsResult = await grantSMSTrialCredits(
          customerId,
          customerType,
          parseFloat(smsAmount),
          duration,
          reason || 'Trial credits granted by admin'
        );

        if (!smsResult.success) {
          toast.error(`Failed to grant SMS trial: ${smsResult.error}`);
          return;
        }
      }

      // Grant AI trial
      if (grantType === 'both' || grantType === 'ai') {
        const aiResult = await grantAITrialCreditsAction(
          customerId,
          customerType,
          parseFloat(aiAmount),
          parseInt(aiTokens),
          duration,
          reason || 'Trial credits granted by admin'
        );

        if (!aiResult.success) {
          toast.error(`Failed to grant AI trial: ${aiResult.error}`);
          return;
        }
      }

      toast.success(
        `✅ Trial credits granted successfully for ${duration} days!`
      );
      setCustomerId('');
      setReason('');
    } catch (error) {
      console.error('Error granting trial credits:', error);
      toast.error('Failed to grant trial credits');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer ID */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Customer ID
        </label>
        <input
          type="text"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          placeholder="Enter customer UUID"
          className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
          required
        />
        <p className="text-xs text-slate-500 mt-1">
          Find the customer ID from the Customers page
        </p>
      </div>

      {/* Customer Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Customer Type
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="user"
              checked={customerType === 'user'}
              onChange={(e) =>
                setCustomerType(e.target.value as 'organization' | 'user')
              }
              className="text-primary"
            />
            <span>Individual</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="organization"
              checked={customerType === 'organization'}
              onChange={(e) =>
                setCustomerType(e.target.value as 'organization' | 'user')
              }
              className="text-primary"
            />
            <span>Organization</span>
          </label>
        </div>
      </div>

      {/* Grant Type */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Grant Type
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="both"
              checked={grantType === 'both'}
              onChange={(e) =>
                setGrantType(e.target.value as 'both' | 'sms' | 'ai')
              }
              className="text-primary"
            />
            <span>SMS + AI</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="sms"
              checked={grantType === 'sms'}
              onChange={(e) =>
                setGrantType(e.target.value as 'both' | 'sms' | 'ai')
              }
              className="text-primary"
            />
            <span>SMS Only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="ai"
              checked={grantType === 'ai'}
              onChange={(e) =>
                setGrantType(e.target.value as 'both' | 'sms' | 'ai')
              }
              className="text-primary"
            />
            <span>AI Only</span>
          </label>
        </div>
      </div>

      {/* SMS Credits */}
      {(grantType === 'both' || grantType === 'sms') && (
        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">SMS Trial Credits</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">
              Credit Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600">
                $
              </span>
              <input
                type="number"
                step="0.01"
                value={smsAmount}
                onChange={(e) => setSmsAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
            <p className="text-xs text-blue-700 mt-1">
              ${smsAmount} = ~
              {Math.round(parseFloat(smsAmount) / 0.01)} SMS messages
            </p>
          </div>
        </div>
      )}

      {/* AI Credits */}
      {(grantType === 'both' || grantType === 'ai') && (
        <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900">AI Trial Credits</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-2">
                Credit Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-600">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={aiAmount}
                  onChange={(e) => setAiAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-2">
                Tokens Included
              </label>
              <input
                type="number"
                value={aiTokens}
                onChange={(e) => setAiTokens(e.target.value)}
                className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                required
              />
              <p className="text-xs text-purple-700 mt-1">
                {parseInt(aiTokens).toLocaleString()} tokens = ~
                {Math.round(parseInt(aiTokens) / 25)} AI requests
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Trial Duration (Days)
        </label>
        <input
          type="number"
          value={durationDays}
          onChange={(e) => setDurationDays(e.target.value)}
          className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
          required
        />
        <p className="text-xs text-slate-500 mt-1">
          Trial expires in {durationDays} days
        </p>
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Reason (Optional)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., New customer onboarding, Enterprise evaluation"
          rows={3}
          className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Granting Trial Credits...
          </>
        ) : (
          'Grant Trial Credits'
        )}
      </Button>
    </form>
  );
}

