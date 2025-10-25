'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  MessageSquare,
  Brain,
  Plus,
  TrendingUp,
  Gift,
} from 'lucide-react';

interface BalanceData {
  sms: {
    balance: number;
    trialCredits: number;
    subscriptionSMSRemaining: number;
  };
  ai: {
    balance: number;
    trialCredits: number;
    subscriptionTokensRemaining: number;
  };
  billingTarget: 'user' | 'organization';
  billingTargetId: string;
}

export default function BalanceWidget() {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/billing/balance');
      if (response.ok) {
        const data = await response.json();
        setBalance(data);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-slate-200 shadow-lg">
        <CardContent className="py-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-200 rounded w-24"></div>
            <div className="h-8 bg-slate-200 rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!balance) return null;

  const totalSMSAvailable =
    balance.sms.balance +
    balance.sms.trialCredits +
    balance.sms.subscriptionSMSRemaining * 0.01;
  const totalAIAvailable =
    balance.ai.balance +
    balance.ai.trialCredits +
    balance.ai.subscriptionTokensRemaining * 0.002;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* SMS Balance Card */}
      <Card className="border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-100 p-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-blue-900">SMS Balance</span>
            </div>
            {balance.sms.trialCredits > 0 && (
              <Badge
                variant="outline"
                className="border-amber-500 text-amber-700"
              >
                <Gift className="h-3 w-3 mr-1" />
                Trial
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-3xl font-bold text-blue-900">
              ${totalSMSAvailable.toFixed(2)}
            </div>
            <p className="text-sm text-blue-700">
              ~{Math.round(totalSMSAvailable / 0.01)} messages available
            </p>
          </div>

          <div className="space-y-2 text-sm">
            {balance.sms.balance > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Prepaid Balance:</span>
                <span className="font-semibold">
                  ${balance.sms.balance.toFixed(2)}
                </span>
              </div>
            )}
            {balance.sms.trialCredits > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>Trial Credits:</span>
                <span className="font-semibold">
                  ${balance.sms.trialCredits.toFixed(2)}
                </span>
              </div>
            )}
            {balance.sms.subscriptionSMSRemaining > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Plan Included:</span>
                <span className="font-semibold">
                  {balance.sms.subscriptionSMSRemaining} SMS
                </span>
              </div>
            )}
          </div>

          <Button size="sm" className="w-full" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add SMS Credits
          </Button>
        </CardContent>
      </Card>

      {/* AI Balance Card */}
      <Card className="border-2 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-purple-100 p-2">
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-purple-900">AI Balance</span>
            </div>
            {balance.ai.trialCredits > 0 && (
              <Badge
                variant="outline"
                className="border-amber-500 text-amber-700"
              >
                <Gift className="h-3 w-3 mr-1" />
                Trial
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-3xl font-bold text-purple-900">
              ${totalAIAvailable.toFixed(2)}
            </div>
            <p className="text-sm text-purple-700">
              ~{Math.round(totalAIAvailable / 0.002)} AI requests available
            </p>
          </div>

          <div className="space-y-2 text-sm">
            {balance.ai.balance > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Prepaid Balance:</span>
                <span className="font-semibold">
                  ${balance.ai.balance.toFixed(2)}
                </span>
              </div>
            )}
            {balance.ai.trialCredits > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>Trial Credits:</span>
                <span className="font-semibold">
                  ${balance.ai.trialCredits.toFixed(2)}
                </span>
              </div>
            )}
            {balance.ai.subscriptionTokensRemaining > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Plan Included:</span>
                <span className="font-semibold">
                  {Math.round(balance.ai.subscriptionTokensRemaining / 1000)}k
                  tokens
                </span>
              </div>
            )}
          </div>

          <Button size="sm" className="w-full" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add AI Credits
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

