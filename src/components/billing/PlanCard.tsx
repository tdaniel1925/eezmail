'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  MessageSquare,
  Brain,
  Loader2,
  Crown,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';

interface PlanCardProps {
  plan: {
    id: string;
    name: string;
    planType: string;
    monthlyPrice: string;
    smsIncluded: number;
    overageRate: string | null;
    aiTokensIncluded: number;
    aiOverageRate: string | null;
    features: unknown;
    maxUsers: number | null;
  };
}

export default function PlanCard({ plan }: PlanCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const features = Array.isArray(plan.features) ? plan.features : [];
  const price = Number(plan.monthlyPrice);
  const isPro = plan.name.toLowerCase().includes('pro');
  const isEnterprise = plan.name.toLowerCase().includes('enterprise');

  const handleSubscribe = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/payments/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to create subscription');
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Failed to initiate subscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className={`border-2 shadow-lg hover:shadow-xl transition-all relative ${
        isPro || isEnterprise
          ? 'border-primary bg-gradient-to-br from-primary/5 to-white'
          : 'border-slate-200'
      }`}
    >
      {(isPro || isEnterprise) && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-white px-4 py-1">
            <Star className="h-3 w-3 mr-1" />
            {isEnterprise ? 'Best Value' : 'Popular'}
          </Badge>
        </div>
      )}

      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-2xl">{plan.name}</CardTitle>
          {plan.planType === 'business' && (
            <Crown className="h-5 w-5 text-amber-600" />
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-slate-900">
            ${price.toFixed(0)}
          </span>
          {price > 0 && (
            <span className="text-slate-600">/month</span>
          )}
        </div>
        {price === 0 && (
          <p className="text-sm text-slate-600">Pay only for what you use</p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Included Credits */}
        <div className="space-y-3">
          {plan.smsIncluded > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <div className="rounded-lg bg-blue-100 p-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <span className="font-semibold text-slate-900">
                  {plan.smsIncluded.toLocaleString()} SMS
                </span>
                <span className="text-slate-600"> included</span>
              </div>
            </div>
          )}
          {plan.aiTokensIncluded > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <div className="rounded-lg bg-purple-100 p-2">
                <Brain className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <span className="font-semibold text-slate-900">
                  {Math.round(plan.aiTokensIncluded / 1000)}k AI tokens
                </span>
                <span className="text-slate-600"> included</span>
              </div>
            </div>
          )}
        </div>

        {/* Overage Rates */}
        {(plan.overageRate || plan.aiOverageRate) && (
          <div className="rounded-lg bg-slate-50 p-3 space-y-1 text-xs">
            {plan.overageRate && (
              <div className="text-slate-600">
                SMS overage: ${Number(plan.overageRate).toFixed(4)}/message
              </div>
            )}
            {plan.aiOverageRate && (
              <div className="text-slate-600">
                AI overage: ${Number(plan.aiOverageRate).toFixed(6)}/1k tokens
              </div>
            )}
          </div>
        )}

        {/* Features */}
        <div className="space-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-700">
                {String(feature).replace(/_/g, ' ')}
              </span>
            </div>
          ))}
          {plan.maxUsers && (
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-700">
                {plan.maxUsers === -1
                  ? 'Unlimited users'
                  : `Up to ${plan.maxUsers} users`}
              </span>
            </div>
          )}
        </div>

        {/* Subscribe Button */}
        <Button
          onClick={handleSubscribe}
          disabled={isLoading}
          className={`w-full ${
            isPro || isEnterprise
              ? 'bg-primary hover:bg-primary/90'
              : ''
          }`}
          variant={isPro || isEnterprise ? 'default' : 'outline'}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : price === 0 ? (
            'Get Started Free'
          ) : (
            'Subscribe Now'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

