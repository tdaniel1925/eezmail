'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';

export default function ResetPasswordPage(): JSX.Element {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    // Check if we have a valid session from the reset email link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setValidToken(true);
        console.log('[RESET PASSWORD] Valid session found');
      } else {
        console.error('[RESET PASSWORD] No valid session found');
        setError('Invalid or expired reset link. Please request a new password reset.');
      }
    };

    checkSession();
  }, [supabase.auth]);

  const handleResetPassword = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      console.log('[RESET PASSWORD] Updating password...');

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('[RESET PASSWORD] Error:', error);
        throw error;
      }

      console.log('[RESET PASSWORD] Password updated successfully');
      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('[RESET PASSWORD] Caught error:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!validToken && error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black px-4 py-12 relative overflow-hidden">
        {/* Background Effects */}
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center -z-10">
          <div className="w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] rounded-full bg-[rgba(60,130,255,0.08)] dark:bg-[rgba(60,130,255,0.15)] blur-[120px] sm:blur-[180px]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 backdrop-blur-md p-8 shadow-lg text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Invalid Reset Link
            </h1>
            <p className="text-gray-600 dark:text-white/60 mb-6">
              {error}
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-600 transition-colors"
            >
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black px-4 py-12 relative overflow-hidden">
        {/* Background Effects */}
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center -z-10">
          <div className="w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] rounded-full bg-[rgba(60,130,255,0.08)] dark:bg-[rgba(60,130,255,0.15)] blur-[120px] sm:blur-[180px]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Success Card */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-8 shadow-lg text-center">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Password Reset Successful!
            </h1>
            <p className="text-gray-600 dark:text-white/60 mb-6">
              Your password has been updated successfully. Redirecting you to the dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black px-4 py-12 relative overflow-hidden">
      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center -z-10">
        <div className="w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] rounded-full bg-[rgba(60,130,255,0.08)] dark:bg-[rgba(60,130,255,0.15)] blur-[120px] sm:blur-[180px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-6">
            <Image
              src="/easemail-logo.png"
              alt="easeMail"
              width={220}
              height={50}
              className="h-10 w-auto"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Set New Password
          </h1>
          <p className="text-gray-600 dark:text-white/60">
            Enter your new password below
          </p>
        </div>

        {/* Reset Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-8 shadow-lg">
          <form onSubmit={handleResetPassword} className="space-y-6">
            {error && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
              >
                New Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-500 dark:text-white/40" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="block w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-10 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-white/50 mt-2">
                At least 6 characters
              </p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-500 dark:text-white/40" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="block w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-10 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <AnimatedButton
              variant="premium"
              type="submit"
              disabled={loading || !validToken}
              loading={loading}
              className="w-full"
            >
              {loading ? 'Updating...' : 'Reset Password'}
            </AnimatedButton>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

