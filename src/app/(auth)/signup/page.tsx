'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Mail, Lock, User, Sparkles, ArrowRight } from 'lucide-react';

export default function SignupPage(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // Redirect to dashboard after successful signup
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
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
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-600 shadow-lg shadow-primary/30">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Join eezMail
          </h1>
          <p className="text-gray-600 dark:text-white/60">
            A Custom Email Client for Darren Miller Law Firm
          </p>
        </div>

        {/* Signup Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-8 shadow-lg">
          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Full Name Input */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-500 dark:text-white/40" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                  className="block w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-10 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-500 dark:text-white/40" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="block w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-10 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
              >
                Password
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

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-200 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create your account</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white/60 dark:bg-white/5 px-4 text-gray-600 dark:text-white/60">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Sign In Link */}
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white backdrop-blur-md transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20"
          >
            Sign in instead
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-600 dark:text-white/50">
          By creating an account, you agree to our{' '}
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
