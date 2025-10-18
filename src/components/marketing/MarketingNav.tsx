'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AnimatedButton } from './AnimatedButton';

export function MarketingNav() {
  return (
    <header className="z-20 [animation:fadeSlideIn_0.5s_ease-in-out_0.1s_both] relative">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex border-white/[0.06] border-b pt-6 pb-6 items-center justify-between">
          <Link href="/" className="inline-flex items-center justify-center w-auto">
            <span className="text-2xl font-bold bg-gradient-to-r from-[#FF4C5A] to-white bg-clip-text text-transparent">
              easeMail
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <Link href="/features" className="hover:text-white transition">
              Features
            </Link>
            <Link href="/security" className="hover:text-white transition">
              Security
            </Link>
            <Link href="/about" className="hover:text-white transition">
              About
            </Link>
            <Link href="/dashboard/settings/billing" className="hover:text-white transition">
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex hover:text-white ring-1 ring-white/[0.06] hover:ring-white/10 transition text-sm font-medium text-white/80 rounded-full pt-2 pr-3.5 pb-2 pl-3.5 border-gradient before:rounded-full"
            >
              Log in
            </Link>
            <Link href="/signup">
              <AnimatedButton>
                Get Started
                <ArrowRight className="h-4 w-4" />
              </AnimatedButton>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

