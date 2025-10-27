'use client';

import { useState } from 'react';
import { loginAction } from '@/app/actions/auth';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

export default function LoginPage(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    console.log('[AUTH] ========== SERVER-SIDE LOGIN STARTED ==========');
    console.log('[AUTH] Login attempt for:', email);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const result = await loginAction(formData);

      if (result?.error) {
        console.error('[AUTH] Login failed:', result.error);

        // Display the error message directly (it now includes helpful context)
        setError(result.error);
        setLoading(false);
      }
      // If no error, redirect happens automatically in server action
    } catch (err) {
      console.error('[AUTH] Caught error:', err);
      setError('An error occurred during login');
      setLoading(false);
    }
  };

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
              alt="EaseMail"
              width={220}
              height={50}
              className="h-10 w-auto"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome!
          </h1>
          <p className="text-gray-600 dark:text-white/60">
            Sign in to your EaseMail account
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-8 shadow-lg">
          {/* OAuth Buttons */}
          <OAuthButtons mode="signin" />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white/60 dark:bg-white/5 px-4 text-gray-600 dark:text-white/60">
                Or sign in with email
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Email/Username Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
              >
                Email or Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-500 dark:text-white/40" />
                </div>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username email"
                  className="block w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-10 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  placeholder="you@example.com or username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary-600 transition-colors"
                >
                  Forgot?
                </Link>
              </div>
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
                  autoComplete="current-password"
                  className="block w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-10 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Sign In Button */}
            <AnimatedButton
              variant="premium"
              type="submit"
              disabled={loading}
              loading={loading}
              icon={<ArrowRight className="h-4 w-4" />}
              className="w-full"
            >
              {loading ? 'Signing in...' : 'Sign in to your account'}
            </AnimatedButton>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white/60 dark:bg-white/5 px-4 text-gray-600 dark:text-white/60">
                New to easeMail?
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Link
            href="/signup"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white backdrop-blur-md transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20"
          >
            Create an account
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-600 dark:text-white/50">
          By signing in, you agree to our{' '}
          <Link
            href="/terms"
            className="underline hover:text-gray-900 dark:hover:text-white/70"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy"
            className="underline hover:text-gray-900 dark:hover:text-white/70"
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
