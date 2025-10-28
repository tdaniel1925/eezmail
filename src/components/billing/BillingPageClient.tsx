'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  MessageSquare,
  Brain,
  Plus,
  TrendingUp,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import BalanceWidget from '@/components/dashboard/BalanceWidget';
import TopUpModal from '@/components/billing/TopUpModal';
import { toast } from 'sonner';

export default function BillingPageClient() {
  const searchParams = useSearchParams();
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpType, setTopUpType] = useState<'sms' | 'ai'>('sms');
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  // Check for success/cancel from Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const update = searchParams.get('update');
    const type = searchParams.get('type');
    const amount = searchParams.get('amount');

    // Check if user needs to update payment method
    if (update === 'true') {
      setShowUpdatePrompt(true);
      toast.error(
        '⚠️ Payment failed. Please update your payment method to continue.',
        {
          duration: 10000,
        }
      );
    }

    if (success === 'true') {
      toast.success(
        `✅ Payment successful! $${amount || '0.00'} added to your ${type?.toUpperCase() || ''} balance.`,
        {
          duration: 5000,
        }
      );

      // Clear query params
      window.history.replaceState({}, '', '/dashboard/billing');
    }

    if (canceled === 'true') {
      toast.error('Payment was canceled', {
        duration: 3000,
      });

      window.history.replaceState({}, '', '/dashboard/billing');
    }
  }, [searchParams]);

  const openTopUp = (type: 'sms' | 'ai') => {
    setTopUpType(type);
    setShowTopUp(true);
  };

  return (
    <div className="space-y-8">
      {/* Payment Update Warning */}
      {showUpdatePrompt && (
        <Card className="border-2 border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="h-5 w-5" />
              Payment Method Update Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800 mb-4">
              We were unable to process your recent payment. Please update your
              payment method to avoid service interruption.
            </p>
            <Button
              variant="destructive"
              onClick={() => {
                setShowUpdatePrompt(false);
                toast.info(
                  'Payment method update feature coming soon. Please contact support for assistance.'
                );
              }}
            >
              Update Payment Method
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Balance Cards */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Current Balance
        </h2>
        <BalanceWidget />
      </div>

      {/* Quick Actions */}
      <Card className="border-2 border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Quick Top-Up
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => openTopUp('sms')}
              className="group p-6 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-all text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="rounded-lg bg-blue-100 p-3 group-hover:bg-blue-200 transition-colors">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <Plus className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-blue-900 mb-1">
                Add SMS Credits
              </h3>
              <p className="text-sm text-blue-700">
                Top up your SMS balance to send more messages
              </p>
            </button>

            <button
              onClick={() => openTopUp('ai')}
              className="group p-6 rounded-lg border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-300 transition-all text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="rounded-lg bg-purple-100 p-3 group-hover:bg-purple-200 transition-colors">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <Plus className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-purple-900 mb-1">
                Add AI Credits
              </h3>
              <p className="text-sm text-purple-700">
                Top up your AI balance for more intelligent features
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="border-2 border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-400">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              No transactions yet
            </h3>
            <p className="text-sm">
              Your payment history will appear here once you make a purchase
            </p>
          </div>

          {/* TODO: Replace with actual transaction list */}
          {/* <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-lg border-2 border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-green-100 p-2">
                    <Plus className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {tx.description}
                    </div>
                    <div className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3" />
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    +${tx.amount.toFixed(2)}
                  </div>
                  <Badge variant="outline" className="mt-1">
                    {tx.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div> */}
        </CardContent>
      </Card>

      {/* Top Up Modal */}
      <TopUpModal
        isOpen={showTopUp}
        onClose={() => setShowTopUp(false)}
        type={topUpType}
      />
    </div>
  );
}
