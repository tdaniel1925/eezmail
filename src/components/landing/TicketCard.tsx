'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface TicketCardProps {
  title: string;
  price: string;
  period?: string;
  features: string[];
  href: string;
  popular?: boolean;
  className?: string;
}

export function TicketCard({
  title,
  price,
  period = '/month',
  features,
  href,
  popular = false,
  className = '',
}: TicketCardProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] text-white px-4 py-1 rounded-full text-sm font-semibold">
            POPULAR
          </div>
        </div>
      )}

      {/* Ticket Design */}
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden border border-white/10">
        {/* Barcode/Pattern Background */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <Image
            src="/landing/images/misc/barcode.webp"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Logo watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <div className="text-8xl font-bold text-white">easeMail</div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{price}</span>
              {price !== 'Custom' && (
                <span className="text-white/60 text-lg">{period}</span>
              )}
            </div>
          </div>

          {/* Features */}
          <ul className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#1E40AF] flex-shrink-0 mt-0.5" />
                <span className="text-white/80 text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <Link
            href={href}
            className="block w-full text-center bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
          >
            Get Started
          </Link>
        </div>

        {/* Gradient accent */}
        {popular && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1E40AF]/10 to-transparent pointer-events-none" />
        )}
      </div>
    </motion.div>
  );
}

