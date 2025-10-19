'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function MarketingNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const handleActiveSectionChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setActiveSection(customEvent.detail);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('activeSectionChange', handleActiveSectionChange as EventListener);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('activeSectionChange', handleActiveSectionChange as EventListener);
    };
  }, []);

  const navLinks = [
    { href: '/#section-about', label: 'About' },
    { href: '/#section-features', label: 'Why Choose' },
    { href: '/#section-team', label: 'Team' },
    { href: '/#section-pricing', label: 'Pricing' },
    { href: '/#section-faq', label: 'FAQ' },
  ];

  const pageLinks = [
    { href: '/features', label: 'Features' },
    { href: '/security', label: 'Security' },
    { href: '/contact', label: 'Contact' },
  ];

  const isActive = (href: string) => {
    const sectionId = href.split('#')[1];
    return sectionId && activeSection === sectionId;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-950/90 backdrop-blur-xl border-b border-white/10 shadow-lg'
          : 'bg-transparent border-b border-white/5'
      }`}
    >
      <div className="flex md:px-8 max-w-7xl mr-auto ml-auto pt-5 pr-6 pb-5 pl-6 items-center justify-between">
        {/* Left: brand + primary nav */}
        <div className="flex md:gap-6 ring-white/5 ring-1 rounded-full pt-1 pr-1 pb-1 pl-1 gap-x-4 gap-y-4 items-center">
          <Link href="/" className="inline-flex items-center justify-center px-4">
            <Image
              src="/images/easemail-logo.png"
              alt="easeMail"
              width={180}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex gap-2 gap-x-2 gap-y-2 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center gap-2 transition text-sm font-medium rounded-full pt-2 pr-3.5 pb-2 pl-3.5 backdrop-blur-sm ${
                  isActive(link.href)
                    ? 'bg-[#1E40AF] text-white ring-[#1E40AF]/50 ring-2'
                    : 'text-white/90 bg-white/5 ring-white/10 ring-1 hover:bg-white/10 hover:ring-white/20'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {pageLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 transition hover:bg-white/10 hover:ring-white/20 text-sm font-medium text-white/90 bg-white/5 ring-white/10 ring-1 rounded-full pt-2 pr-3.5 pb-2 pl-3.5 backdrop-blur-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden inline-flex items-center gap-2 transition hover:bg-white/10 hover:ring-white/20 text-sm font-medium text-white/90 bg-white/5 ring-white/10 ring-1 rounded-full p-2 backdrop-blur-sm"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Right: auth */}
        <div className="hidden sm:flex ring-white/5 ring-1 rounded-full pt-1 pr-1 pb-1 pl-1 gap-x-2 gap-y-2 items-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 transition hover:bg-white/10 hover:ring-white/20 text-sm font-medium text-white/90 bg-white/5 ring-white/10 ring-1 rounded-full pt-2 pr-3.5 pb-2 pl-3.5 backdrop-blur-sm"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 transition hover:bg-white/15 hover:ring-white/25 ring-white/15 ring-1 text-sm font-medium text-white/90 bg-white/10 rounded-full pt-2 pr-3.5 pb-2 pl-3.5 backdrop-blur-sm"
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-xl overflow-hidden"
          >
            <nav className="container mx-auto px-6 py-6 flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg transition ${
                    isActive(link.href)
                      ? 'bg-[#1E40AF] text-white'
                      : 'text-white/90 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {pageLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-white/90 bg-white/5 hover:bg-white/10 transition"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-white/10">
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-center text-white/90 bg-white/5 hover:bg-white/10 transition"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-center text-white bg-[#1E40AF] hover:bg-[#1E40AF]/90 transition"
                >
                  Get Started
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
