'use client';

import { useEffect, useState } from 'react';

interface StatCardProps {
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
  delay?: number;
}

export function StatCard({ value, label, prefix = '', suffix = '', delay = 0 }: StatCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`border-gradient before:rounded-2xl bg-white/5 rounded-2xl p-8 text-center backdrop-blur transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF4C5A] to-white mb-2">
        {prefix}{value}{suffix}
      </div>
      <div className="text-white/70 text-sm md:text-base">{label}</div>
    </div>
  );
}

interface StatsGridProps {
  stats: Array<{
    value: string;
    label: string;
    prefix?: string;
    suffix?: string;
  }>;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {stats.map((stat, idx) => (
        <StatCard
          key={idx}
          value={stat.value}
          label={stat.label}
          prefix={stat.prefix}
          suffix={stat.suffix}
          delay={idx * 100}
        />
      ))}
    </div>
  );
}

