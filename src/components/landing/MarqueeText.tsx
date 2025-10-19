'use client';

import { useEffect, useRef } from 'react';

interface MarqueeTextProps {
  items: string[];
  speed?: number;
  direction?: 'left' | 'right';
  className?: string;
}

export function MarqueeText({
  items,
  speed = 50,
  direction = 'left',
  className = '',
}: MarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const content = container.querySelector('.marquee-content') as HTMLElement;
    if (!content) return;

    // Clone content for seamless loop
    const clone = content.cloneNode(true) as HTMLElement;
    container.appendChild(clone);

    // Calculate animation duration based on content width
    const contentWidth = content.offsetWidth;
    const duration = contentWidth / speed;

    content.style.animation = `marquee-${direction} ${duration}s linear infinite`;
    clone.style.animation = `marquee-${direction} ${duration}s linear infinite`;
  }, [items, speed, direction]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <style jsx>{`
        @keyframes marquee-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        @keyframes marquee-right {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(0);
          }
        }
      `}</style>
      <div ref={containerRef} className="flex whitespace-nowrap">
        <div className="marquee-content flex items-center">
          {items.map((item, index) => (
            <span key={index} className="mx-3 fs-60">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

