'use client';

import Link from 'next/link';

export function MarketingNav() {
  return (
    <header className="z-10 border-white/5 border-b relative">
      <div className="flex md:px-8 max-w-7xl mr-auto ml-auto pt-5 pr-6 pb-5 pl-6 items-center justify-between">
        {/* Left: brand + primary nav */}
        <div className="flex md:gap-6 ring-white/5 ring-1 [animation:fadeSlideIn_1s_ease-out_0.1s_both] rounded-full pt-1 pr-1 pb-1 pl-1 gap-x-4 gap-y-4 items-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center text-xl font-bold bg-gradient-to-r from-[#FF4C5A] to-white bg-clip-text text-transparent px-4"
          >
            easeMail
          </Link>
          <nav className="hidden md:flex gap-2 gap-x-2 gap-y-2 items-center">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 transition hover:bg-white/10 hover:ring-white/20 text-sm font-medium text-white/90 bg-white/5 ring-white/10 ring-1 rounded-full pt-2 pr-3.5 pb-2 pl-3.5 backdrop-blur-sm"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 transition hover:bg-white/10 hover:ring-white/20 text-sm font-medium text-white/90 bg-white/5 ring-white/10 ring-1 rounded-full pt-2 pr-3.5 pb-2 pl-3.5 backdrop-blur-sm"
            >
              Pricing
            </Link>
            <Link
              href="/security"
              className="inline-flex items-center gap-2 transition hover:bg-white/10 hover:ring-white/20 text-sm font-medium text-white/90 bg-white/5 ring-white/10 ring-1 rounded-full pt-2 pr-3.5 pb-2 pl-3.5 backdrop-blur-sm"
            >
              Security
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 transition hover:bg-white/10 hover:ring-white/20 text-sm font-medium text-white/90 bg-white/5 ring-white/10 ring-1 rounded-full pt-2 pr-3.5 pb-2 pl-3.5 backdrop-blur-sm"
            >
              About
            </Link>
          </nav>
        </div>

        {/* Right: auth */}
        <div className="flex ring-white/5 ring-1 rounded-full pt-1 pr-1 pb-1 pl-1 gap-x-2 gap-y-2 items-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 transition hover:bg-white/10 hover:ring-white/20 [animation:fadeSlideIn_1s_ease-out_0.2s_both] text-sm font-medium text-white/90 bg-white/5 ring-white/10 ring-1 rounded-full pt-2 pr-3.5 pb-2 pl-3.5 backdrop-blur-sm"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 transition hover:bg-white/15 hover:ring-white/25 ring-white/15 ring-1 [animation:fadeSlideIn_1s_ease-out_0.3s_both] text-sm font-medium text-white/90 bg-white/10 rounded-full pt-2 pr-3.5 pb-2 pl-3.5 backdrop-blur-sm"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}


