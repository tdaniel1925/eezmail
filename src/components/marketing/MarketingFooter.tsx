'use client';

import Link from 'next/link';

export function MarketingFooter() {
  return (
    <footer className="overflow-hidden bg-slate-950 border-white/5 border-t relative">
      {/* Decorative grid lines */}
      <div className="pointer-events-none z-0 absolute inset-0">
        <div className="absolute inset-y-0 left-[12.5%] w-px bg-gradient-to-b from-white/5 via-white/5 to-transparent"></div>
        <div className="absolute inset-y-0 left-[37.5%] w-px bg-gradient-to-b from-white/5 via-white/5 to-transparent"></div>
        <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-white/8 via-white/5 to-transparent"></div>
        <div className="absolute inset-y-0 left-[62.5%] w-px bg-gradient-to-b from-white/5 via-white/5 to-transparent"></div>
      </div>

      <div className="z-10 md:px-8 lg:py-20 max-w-7xl mr-auto ml-auto pt-16 pr-6 pb-16 pl-6 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center text-xl font-bold bg-gradient-to-r from-[#FF4C5A] to-white bg-clip-text text-transparent"
            >
              easeMail
            </Link>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-xs">
              Building the future of AI-powered email management for forward-thinking professionals.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-white/5 ring-1 ring-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"></path>
                </svg>
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-white/5 ring-1 ring-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-white/5 ring-1 ring-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path>
                </svg>
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-medium text-white">Product</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/features" className="text-sm text-slate-400 hover:text-white transition">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-slate-400 hover:text-white transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-slate-400 hover:text-white transition">
                  Integrations
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-slate-400 hover:text-white transition">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-medium text-white">Company</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/about" className="text-sm text-slate-400 hover:text-white transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-slate-400 hover:text-white transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-slate-400 hover:text-white transition">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-slate-400 hover:text-white transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-medium text-white">Resources</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="#" className="text-sm text-slate-400 hover:text-white transition">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-slate-400 hover:text-white transition">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-slate-400 hover:text-white transition">
                  Community
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-slate-400 hover:text-white transition">
                  Status
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-medium text-white">Legal</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="#" className="text-sm text-slate-400 hover:text-white transition">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-slate-400 hover:text-white transition">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-sm text-slate-400 hover:text-white transition">
                  Security
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-slate-400 hover:text-white transition">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">© 2025 easeMail. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-sm text-slate-400 hover:text-white transition">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm text-slate-400 hover:text-white transition">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm text-slate-400 hover:text-white transition">
              Cookie Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
