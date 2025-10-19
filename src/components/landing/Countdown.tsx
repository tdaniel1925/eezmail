'use client';

import { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: Date;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function Countdown({ targetDate, className = '' }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }

      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="text-4xl md:text-6xl font-bold text-white mb-2">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-sm md:text-base text-white/60 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );

  return (
    <div className={`flex gap-4 md:gap-8 ${className}`}>
      <TimeBlock value={timeLeft.days} label="Days" />
      <div className="text-4xl md:text-6xl font-bold text-white/40">:</div>
      <TimeBlock value={timeLeft.hours} label="Hours" />
      <div className="text-4xl md:text-6xl font-bold text-white/40">:</div>
      <TimeBlock value={timeLeft.minutes} label="Minutes" />
      <div className="text-4xl md:text-6xl font-bold text-white/40">:</div>
      <TimeBlock value={timeLeft.seconds} label="Seconds" />
    </div>
  );
}

