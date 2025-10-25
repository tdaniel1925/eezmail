'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  setCustomSMSPricing,
  setCustomAIPricing,
} from '@/lib/admin/platform-actions';
import { Loader2 } from 'lucide-react';

export default function PricingForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [customerType, setCustomerType] = useState<'organization' | 'user'>(
    'user'
  );
  const [smsRate, setSmsRate] = useState('0.0100');
  const [aiRate, setAiRate] = useState('0.002000');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!customerId.trim()) {
        toast.error('Please enter a customer ID');
        return;
      }

      // Set SMS pricing
      const smsResult = await setCustomSMSPricing(
        customerId,
        customerType,
        parseFloat(smsRate),
        reason || 'Custom pricing set by admin'
      );

      if (!smsResult.success) {
        toast.error(`Failed to set SMS pricing: ${smsResult.error}`);
        return;
      }

      // Set AI pricing
      const aiResult = await setCustomAIPricing(
        customerId,
        customerType,
        parseFloat(aiRate),
        reason || 'Custom pricing set by admin'
      );

      if (!aiResult.success) {
        toast.error(`Failed to set AI pricing: ${aiResult.error}`);
        return;
      }

      toast.success('✅ Custom pricing set successfully!');
      setCustomerId('');
      setReason('');
    } catch (error) {
      console.error('Error setting custom pricing:', error);
      toast.error('Failed to set custom pricing');
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

      {/* SMS Rate */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Custom SMS Rate
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            $
          </span>
          <input
            type="number"
            step="0.0001"
            value={smsRate}
            onChange={(e) => setSmsRate(e.target.value)}
            className="w-full pl-8 pr-4 py-2 border-2 border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
            required
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">Rate per SMS message</p>
      </div>

      {/* AI Rate */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Custom AI Rate (per 1k tokens)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            $
          </span>
          <input
            type="number"
            step="0.000001"
            value={aiRate}
            onChange={(e) => setAiRate(e.target.value)}
            className="w-full pl-8 pr-4 py-2 border-2 border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
            required
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Rate per 1,000 AI tokens
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
          placeholder="e.g., Volume discount, Enterprise agreement"
          rows={3}
          className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Setting Custom Pricing...
          </>
        ) : (
          'Set Custom Pricing'
        )}
      </Button>
    </form>
  );
}

