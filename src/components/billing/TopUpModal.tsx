'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, MessageSquare, Brain, Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'sms' | 'ai';
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 250];

export default function TopUpModal({ isOpen, onClose, type }: TopUpModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(25);
  const [customAmount, setCustomAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const amount = customAmount ? parseFloat(customAmount) : selectedAmount;

  const handleTopUp = async () => {
    if (!amount || amount < 5) {
      toast.error('Minimum top-up amount is $5.00');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/payments/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, type }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to create checkout session');
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to initiate payment');
    } finally {
      setIsLoading(false);
    }
  };

  const estimatedCredits =
    type === 'sms'
      ? Math.floor((amount || 0) / 0.01)
      : Math.floor(((amount || 0) / 0.002) * 1000);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'sms' ? (
              <>
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <span>Top Up SMS Credits</span>
              </>
            ) : (
              <>
                <Brain className="h-5 w-5 text-purple-600" />
                <span>Top Up AI Credits</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preset Amounts */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-3 block">
              Select Amount
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setSelectedAmount(preset);
                    setCustomAmount('');
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedAmount === preset && !customAmount
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-lg font-bold text-slate-900">
                    ${preset}
                  </div>
                  <div className="text-xs text-slate-600">
                    ~{type === 'sms' ? Math.floor(preset / 0.01) : Math.floor((preset / 0.002) * 1000)}
                    {type === 'sms' ? ' SMS' : ' tokens'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Or Enter Custom Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                $
              </span>
              <input
                type="number"
                min="5"
                step="0.01"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                placeholder="5.00"
                className="w-full pl-8 pr-4 py-2 border-2 border-slate-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Minimum: $5.00
            </p>
          </div>

          {/* Estimate */}
          {amount && amount >= 5 && (
            <div
              className={`rounded-lg p-4 ${
                type === 'sms' ? 'bg-blue-50 border-2 border-blue-200' : 'bg-purple-50 border-2 border-purple-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${
                    type === 'sms' ? 'text-blue-900' : 'text-purple-900'
                  }`}
                >
                  You'll receive:
                </span>
                <div className="text-right">
                  <div
                    className={`text-2xl font-bold ${
                      type === 'sms' ? 'text-blue-900' : 'text-purple-900'
                    }`}
                  >
                    {estimatedCredits.toLocaleString()}
                  </div>
                  <div
                    className={`text-xs ${
                      type === 'sms' ? 'text-blue-700' : 'text-purple-700'
                    }`}
                  >
                    {type === 'sms' ? 'SMS messages' : 'AI tokens'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="rounded-lg border-2 border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-900">
                Secure Payment via Stripe
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Your payment information is processed securely. We never store your card details.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTopUp}
              className="flex-1"
              disabled={isLoading || !amount || amount < 5}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Pay ${amount?.toFixed(2) || '0.00'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

