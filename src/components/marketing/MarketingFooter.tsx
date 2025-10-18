import Link from 'next/link';

export function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="border-white/[0.06] border-t mt-20 pt-10 pb-10">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-xs text-white/50">
              © {currentYear} easeMail by BotMakers, Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-xs text-white/60">
              <Link href="/security" className="hover:text-white transition">
                Privacy
              </Link>
              <Link href="/security" className="hover:text-white transition">
                Security
              </Link>
              <Link href="/about" className="hover:text-white transition">
                About
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

