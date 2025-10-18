'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export function ParticlesBackground() {
  useEffect(() => {
    // Initialize particles only after script loads
    const initParticles = () => {
      if (typeof window !== 'undefined' && (window as any).particlesJS) {
        (window as any).particlesJS('particles-js', {
          particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: '#ffffff' },
            shape: { type: 'circle' },
            opacity: { value: 0.5, random: false },
            size: { value: 3, random: true },
            line_linked: {
              enable: true,
              distance: 150,
              color: '#ffffff',
              opacity: 0.4,
              width: 1,
            },
            move: {
              enable: true,
              speed: 6,
              direction: 'none',
              random: false,
              straight: false,
              out_mode: 'out',
              bounce: false,
            },
          },
          interactivity: {
            detect_on: 'canvas',
            events: {
              onhover: { enable: true, mode: 'repulse' },
              onclick: { enable: true, mode: 'push' },
              resize: true,
            },
            modes: {
              grab: { distance: 400, line_linked: { opacity: 1 } },
              bubble: {
                distance: 400,
                size: 40,
                duration: 2,
                opacity: 8,
                speed: 3,
              },
              repulse: { distance: 200, duration: 0.4 },
              push: { particles_nb: 4 },
              remove: { particles_nb: 2 },
            },
          },
          retina_detect: true,
        });
      }
    };

    // Check if particles is already loaded
    if ((window as any).particlesJS) {
      initParticles();
    } else {
      // Wait for script to load
      const checkParticles = setInterval(() => {
        if ((window as any).particlesJS) {
          clearInterval(checkParticles);
          initParticles();
        }
      }, 100);

      return () => clearInterval(checkParticles);
    }
  }, []);

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js"
        strategy="lazyOnload"
      />
      <div
        id="particles-js"
        className="absolute inset-0 -z-10"
        style={{ width: '100%', height: '100%' }}
      />
    </>
  );
}

