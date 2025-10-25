'use client';

import { Badge } from '@/components/ui/badge';
import { Building2, User, DollarSign, MessageSquare, Brain } from 'lucide-react';

interface TopCustomersTableProps {
  customers: Array<{
    id: string;
    name: string;
    type: 'organization' | 'individual';
    smsCount: number;
    smsRevenue: number;
    aiTokens: number;
    aiRevenue: number;
    totalRevenue: number;
  }>;
}

export default function TopCustomersTable({
  customers,
}: TopCustomersTableProps) {
  if (!customers || customers.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        No customer data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
              Rank
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
              Customer
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
              SMS Usage
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
              AI Usage
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
              Total Revenue
            </th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer, index) => (
            <tr
              key={customer.id}
              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <td className="py-4 px-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0
                      ? 'bg-yellow-100 text-yellow-700'
                      : index === 1
                        ? 'bg-slate-200 text-slate-700'
                        : index === 2
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {index + 1}
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-lg p-2 ${
                      customer.type === 'organization'
                        ? 'bg-blue-100'
                        : 'bg-purple-100'
                    }`}
                  >
                    {customer.type === 'organization' ? (
                      <Building2
                        className={`h-4 w-4 ${
                          customer.type === 'organization'
                            ? 'text-blue-600'
                            : 'text-purple-600'
                        }`}
                      />
                    ) : (
                      <User className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {customer.name}
                    </div>
                    <Badge
                      variant={
                        customer.type === 'organization'
                          ? 'default'
                          : 'secondary'
                      }
                      className="mt-1"
                    >
                      {customer.type}
                    </Badge>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4 text-right">
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-slate-900">
                      {customer.smsCount.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-sm text-blue-600">
                    ${customer.smsRevenue.toFixed(2)}
                  </span>
                </div>
              </td>
              <td className="py-4 px-4 text-right">
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-600" />
                    <span className="font-semibold text-slate-900">
                      {Math.round(customer.aiTokens / 1000)}k
                    </span>
                  </div>
                  <span className="text-sm text-purple-600">
                    ${customer.aiRevenue.toFixed(2)}
                  </span>
                </div>
              </td>
              <td className="py-4 px-4 text-right">
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-xl font-bold text-green-600">
                      ${customer.totalRevenue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

