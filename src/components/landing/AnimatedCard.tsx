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
      className={`group relative rounded-xl overflow-hidden cursor-pointer border border-white/10 ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ scale: 1.03, y: -8 }}
      transition={{ duration: 0.5 }}
    >
      {/* Image */}
      <div className="relative w-full h-full overflow-hidden">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-2"
        />
      </div>

      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t ${gradientFrom} ${gradientTo} opacity-60 transition-opacity duration-500 group-hover:opacity-70`} />

      {/* Hover radial gradient */}
      <div className="absolute inset-0 bg-radial-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(circle at center, rgba(30, 64, 175, 0.4) 0%, transparent 70%)',
        }}
      />

      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
            transform: 'translateX(-100%)',
            animation: 'shine 2s ease-in-out',
          }}
        />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-10 transform transition-transform duration-500 group-hover:translate-y-[-8px]">
        <div className="relative">
          <h4 className="text-xl md:text-2xl font-semibold text-white mb-2 transition-all duration-300 group-hover:text-[#3B82F6]">
            {title}
          </h4>
          <p className="text-white/80 text-sm md:text-base transition-all duration-300 group-hover:text-white">
            {description}
          </p>
        </div>
      </div>

      {/* Bottom gradient edge */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-slate-950 to-transparent" />
      
      {/* Border glow on hover */}
      <div className="absolute inset-0 rounded-xl ring-2 ring-[#1E40AF] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
}

