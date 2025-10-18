'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export function AnimatedButton({ 
  variant = 'primary', 
  children, 
  className,
  ...props 
}: AnimatedButtonProps) {
  if (variant === 'secondary') {
    return (
      <button
        className={cn(
          "inline-flex items-center gap-2 border-gradient before:rounded-full hover:bg-white/10 transition text-sm font-medium text-white/80 bg-white/5 rounded-full px-4 py-2 backdrop-blur",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "animated-button shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)]",
        className
      )}
      {...props}
    >
      <div className="points-wrapper">
        {[...Array(10)].map((_, i) => (
          <i key={i} className="point"></i>
        ))}
      </div>
      <span className="button-inner">{children}</span>

      <style jsx>{`
        .animated-button {
          cursor: pointer;
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: all 0.25s ease;
          background: radial-gradient(65.28% 65.28% at 50% 100%,
              rgba(255, 76, 90, 0.8) 0%,
              rgba(255, 76, 90, 0) 100%),
            linear-gradient(0deg, #FF4C5A, #FF4C5A);
          border-radius: 9999px;
          border: none;
          outline: none;
          padding: 12px 24px;
          min-height: 48px;
          min-width: 102px;
        }

        .animated-button::before,
        .animated-button::after {
          content: "";
          position: absolute;
          transition: all 0.5s ease-in-out;
          z-index: 0;
        }

        .animated-button::before {
          inset: 1px;
          background: linear-gradient(177.95deg,
              rgba(255, 255, 255, 0.19) 0%,
              rgba(255, 255, 255, 0) 100%);
          border-radius: 9999px;
        }

        .animated-button::after {
          inset: 2px;
          background: radial-gradient(65.28% 65.28% at 50% 100%,
              rgba(255, 76, 90, 0.8) 0%,
              rgba(255, 76, 90, 0) 100%),
            linear-gradient(0deg, #FF4C5A, #FF4C5A);
          border-radius: 9999px;
        }

        .animated-button:active {
          transform: scale(0.95);
        }

        .points-wrapper {
          overflow: hidden;
          width: 100%;
          height: 100%;
          pointer-events: none;
          position: absolute;
          z-index: 1;
        }

        .points-wrapper .point {
          bottom: -10px;
          position: absolute;
          animation: floating-points infinite ease-in-out;
          pointer-events: none;
          width: 2px;
          height: 2px;
          background-color: #fff;
          border-radius: 9999px;
        }

        @keyframes floating-points {
          0% {
            transform: translateY(0);
          }
          85% {
            opacity: 0;
          }
          100% {
            transform: translateY(-55px);
            opacity: 0;
          }
        }

        .points-wrapper .point:nth-child(1) {
          left: 10%;
          opacity: 1;
          animation-duration: 2.35s;
          animation-delay: 0.2s;
        }

        .points-wrapper .point:nth-child(2) {
          left: 30%;
          opacity: 0.7;
          animation-duration: 2.5s;
          animation-delay: 0.5s;
        }

        .points-wrapper .point:nth-child(3) {
          left: 25%;
          opacity: 0.8;
          animation-duration: 2.2s;
          animation-delay: 0.1s;
        }

        .points-wrapper .point:nth-child(4) {
          left: 44%;
          opacity: 0.6;
          animation-duration: 2.05s;
        }

        .points-wrapper .point:nth-child(5) {
          left: 50%;
          opacity: 1;
          animation-duration: 1.9s;
        }

        .points-wrapper .point:nth-child(6) {
          left: 75%;
          opacity: 0.5;
          animation-duration: 1.5s;
          animation-delay: 1.5s;
        }

        .points-wrapper .point:nth-child(7) {
          left: 88%;
          opacity: 0.9;
          animation-duration: 2.2s;
          animation-delay: 0.2s;
        }

        .points-wrapper .point:nth-child(8) {
          left: 58%;
          opacity: 0.8;
          animation-duration: 2.25s;
          animation-delay: 0.2s;
        }

        .points-wrapper .point:nth-child(9) {
          left: 98%;
          opacity: 0.6;
          animation-duration: 2.6s;
          animation-delay: 0.1s;
        }

        .points-wrapper .point:nth-child(10) {
          left: 65%;
          opacity: 1;
          animation-duration: 2.5s;
          animation-delay: 0.2s;
        }

        .button-inner {
          z-index: 2;
          gap: 6px;
          position: relative;
          width: 100%;
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 500;
          line-height: 1.5;
          transition: color 0.2s ease-in-out;
        }

        .button-inner :global(svg) {
          width: 18px;
          height: 18px;
          transition: transform 0.3s ease;
          stroke: white;
          fill: none;
        }

        .animated-button:hover .button-inner :global(svg) {
          transform: translateX(2px);
        }
      `}</style>
    </button>
  );
}

