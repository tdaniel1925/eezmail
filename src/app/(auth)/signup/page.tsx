'use client';

import { useState, useCallback } from 'react';
import { signupAction } from '@/app/actions/auth';
import Link from 'next/link';
import {
  Mail,
  Lock,
  User,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle,
  XCircle,
  Check,
  X,
} from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { cn } from '@/lib/utils';

// Debounce helper
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default function SignupPage(): JSX.Element {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Username validation state
  const [usernameValidation, setUsernameValidation] = useState<{
    valid: boolean;
    message: string;
    checking: boolean;
  }>({ valid: false, message: '', checking: false });

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    label: string;
    checks: {
      length: boolean;
      number: boolean;
      special: boolean;
      uppercase: boolean;
    };
  }>({
    score: 0,
    label: 'weak',
    checks: { length: false, number: false, special: false, uppercase: false },
  });

  // Username validation (debounced)
  const validateUsername = useCallback(
    debounce(async (value: string) => {
      if (!value || value.length < 3) {
        setUsernameValidation({
          valid: false,
          message: 'Username must be at least 3 characters',
          checking: false,
        });
        return;
      }

      if (!/^[a-z0-9_]+$/.test(value)) {
        setUsernameValidation({
          valid: false,
          message: 'Only lowercase letters, numbers, and _ allowed',
          checking: false,
        });
        return;
      }

      setUsernameValidation({ valid: false, message: '', checking: true });

      try {
        const response = await fetch(
          `/api/auth/check-username?username=${value}`
        );
        const data = await response.json();

        if (data.available) {
          setUsernameValidation({
            valid: true,
            message: 'Username available!',
            checking: false,
          });
        } else {
          const suggestions = data.suggestions || [];
          setUsernameValidation({
            valid: false,
            message: `Taken. Try: ${suggestions.slice(0, 2).join(', ')}`,
            checking: false,
          });
        }
      } catch (error) {
        setUsernameValidation({
          valid: false,
          message: 'Could not check availability',
          checking: false,
        });
      }
    }, 500),
    []
  );

  // Password strength calculation
  const calculatePasswordStrength = (pwd: string): void => {
    const checks = {
      length: pwd.length >= 8,
      number: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
      uppercase: /[A-Z]/.test(pwd),
    };

    const score = Object.values(checks).filter(Boolean).length;
    const labels = ['weak', 'weak', 'fair', 'good', 'strong'];

    setPasswordStrength({
      score,
      label: labels[score],
      checks,
    });
  };

  const handleSignup = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    console.log(
      '[SIGNUP] Attempting signup for:',
      email,
      'username:',
      username
    );

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('username', username);
      formData.append('password', password);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('fullName', `${firstName} ${lastName}`);

      const result = await signupAction(formData);

      if (result?.error) {
        console.error('[SIGNUP] Error:', result.error);
        setError(result.error);
        setLoading(false);
      } else if (result?.success) {
        console.log('[SIGNUP] Signup successful');
        setSuccess(true);
        // Redirect will happen from server action
      }
    } catch (err) {
      console.error('[SIGNUP] Caught error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Join EaseMail
          </h1>
        </div>

        {/* Signup Card */}
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md p-8 shadow-lg">
          {success ? (
            <div className="text-center py-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <svg
                  className="h-6 w-6 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Account Created!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Redirecting you to the dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-5">
              {error && (
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {/* First Name Input */}
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                >
                  First Name *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-5 w-5 text-gray-500 dark:text-white/40" />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    autoComplete="given-name"
                    className="block w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-10 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="John"
                  />
                </div>
              </div>

              {/* Last Name Input */}
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                >
                  Last Name *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-5 w-5 text-gray-500 dark:text-white/40" />
                  </div>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    autoComplete="family-name"
                    className="block w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-10 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="Doe"
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  For notifications and password recovery only
                </p>
              </div>

              {/* Username Input */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                >
                  Username *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-5 w-5 text-gray-500 dark:text-white/40" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      const sanitized = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, '');
                      setUsername(sanitized);
                      validateUsername(sanitized);
                    }}
                    required
                    autoComplete="username"
                    pattern="[a-z0-9_]{3,30}"
                    minLength={3}
                    maxLength={30}
                    className="block w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-10 pr-12 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="your_username"
                  />
                  {/* Validation indicator */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {usernameValidation.checking ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    ) : usernameValidation.valid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : username.length > 0 ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : null}
                  </div>
                </div>
                {/* Validation message */}
                {usernameValidation.message && (
                  <p
                    className={cn(
                      'text-xs mt-1',
                      usernameValidation.valid
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {usernameValidation.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Used for login (3-30 chars, lowercase, numbers, underscores)
                </p>
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                >
                  Password *
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-gray-500 dark:text-white/40" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      calculatePasswordStrength(e.target.value);
                    }}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="block w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-10 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 backdrop-blur-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>

                {/* Strength meter */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all duration-300',
                            passwordStrength.score === 0 && 'w-0',
                            passwordStrength.score === 1 && 'w-1/4 bg-red-500',
                            passwordStrength.score === 2 &&
                              'w-1/2 bg-orange-500',
                            passwordStrength.score === 3 &&
                              'w-3/4 bg-yellow-500',
                            passwordStrength.score === 4 &&
                              'w-full bg-green-500'
                          )}
                        />
                      </div>
                      <span className="text-xs font-medium capitalize min-w-[50px]">
                        {passwordStrength.label}
                      </span>
                    </div>

                    {/* Requirements checklist */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        {passwordStrength.checks.length ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-gray-400" />
                        )}
                        <span
                          className={
                            passwordStrength.checks.length
                              ? 'text-green-600 dark:text-green-400'
                              : ''
                          }
                        >
                          At least 8 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {passwordStrength.checks.number ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-gray-400" />
                        )}
                        <span
                          className={
                            passwordStrength.checks.number
                              ? 'text-green-600 dark:text-green-400'
                              : ''
                          }
                        >
                          Contains a number
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {passwordStrength.checks.special ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-gray-400" />
                        )}
                        <span
                          className={
                            passwordStrength.checks.special
                              ? 'text-green-600 dark:text-green-400'
                              : ''
                          }
                        >
                          Contains special character
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {passwordStrength.checks.uppercase ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-gray-400" />
                        )}
                        <span
                          className={
                            passwordStrength.checks.uppercase
                              ? 'text-green-600 dark:text-green-400'
                              : ''
                          }
                        >
                          Contains uppercase letter
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sign Up Button */}
              <AnimatedButton
                variant="premium"
                type="submit"
                disabled={loading}
                loading={loading}
                icon={<ArrowRight className="h-4 w-4" />}
                className="w-full"
              >
                {loading ? 'Creating account...' : 'Create your account'}
              </AnimatedButton>
            </form>
          )}

          {!success && (
            <>
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
            </>
          )}
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
