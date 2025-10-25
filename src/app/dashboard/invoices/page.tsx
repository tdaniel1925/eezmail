import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserInvoices } from '@/lib/invoices/invoice-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Receipt,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const invoicesResult = await getUserInvoices();
  const invoices = invoicesResult.success ? invoicesResult.invoices : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
          <p className="text-slate-600">
            View and download your payment invoices
          </p>
        </div>

        {/* Invoices List */}
        <Card className="border-2 border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Invoice History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices && invoices.length > 0 ? (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 rounded-lg border-2 border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {invoice.invoiceNumber}
                        </div>
                        <div className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3" />
                          {invoice.createdAt
                            ? new Date(invoice.createdAt).toLocaleDateString()
                            : 'N/A'}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {invoice.type === 'top_up' ? 'Top-up' : 'Subscription'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900">
                          ${Number(invoice.amount).toFixed(2)}
                        </div>
                        <Badge
                          variant={
                            invoice.status === 'paid' ? 'default' : 'secondary'
                          }
                          className="mt-1"
                        >
                          {invoice.status === 'paid' && (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {invoice.status === 'pending' && (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {invoice.status === 'failed' && (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {invoice.status}
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Receipt className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">
                  No invoices yet
                </h3>
                <p className="text-sm">
                  Your invoice history will appear here after you make a payment
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

