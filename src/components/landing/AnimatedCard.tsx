'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface AnimatedCardProps {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt?: string;
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

export function AnimatedCard({
  title,
  description,
  imageSrc,
  imageAlt = '',
  className = '',
  gradientFrom = 'from-[#1E40AF]',
  gradientTo = 'to-transparent',
}: AnimatedCardProps) {
  return (
    <motion.div
      className={`group relative rounded-xl overflow-hidden cursor-pointer ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Image */}
      <div className="relative w-full h-full">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t ${gradientFrom} ${gradientTo} opacity-60`} />

      {/* Hover radial gradient */}
      <div className="absolute inset-0 bg-radial-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(circle at center, rgba(30, 64, 175, 0.4) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-10">
        <div className="relative">
          <h4 className="text-xl md:text-2xl font-semibold text-white mb-2">
            {title}
          </h4>
          <p className="text-white/80 text-sm md:text-base">
            {description}
          </p>
        </div>
      </div>

      {/* Bottom gradient edge */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-slate-950 to-transparent" />
    </motion.div>
  );
}

