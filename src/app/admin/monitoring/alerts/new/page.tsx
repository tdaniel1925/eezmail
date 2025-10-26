/**
 * Create Alert Rule Page
 * Form to create new alert rules
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AlertRuleForm } from '@/components/admin/AlertRuleForm';
import { ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function NewAlertRulePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'super_admin' && userData?.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/monitoring/alerts">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Create Alert Rule
                </h1>
                <p className="text-sm text-gray-500">
                  Define conditions for automated alerts
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <AlertRuleForm />
      </div>
    </div>
  );
}
