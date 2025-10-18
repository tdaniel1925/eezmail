import { Inter } from 'next/font/google';
import Script from 'next/script';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { ParticlesBackground } from '@/components/marketing/ParticlesBackground';
import { GradientBlur } from '@/components/marketing/GradientBlur';
import '@/components/marketing/template-animations.css';

const inter = Inter({ subsets: ['latin'] });

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Geist font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="h-full bg-slate-950 text-slate-100 antialiased"
        style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial' }}
      >
        {/* Particles Background */}
        <div className="aura-background-component z-10 mix-blend-screen w-full h-screen absolute top-0">
          <ParticlesBackground />
        </div>

        {/* Marketing Content */}
        <div className="relative">
          <MarketingNav />
          <GradientBlur />
          <main className="relative">{children}</main>
          <MarketingFooter />
        </div>

        {/* Scroll animation init script */}
        <Script id="scroll-animations" strategy="afterInteractive">
          {`
            (function () {
              const once = true;
              if (!window.__inViewIO) {
                window.__inViewIO = new IntersectionObserver((entries) => {
                  entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                      entry.target.classList.add("animate");
                      if (once) window.__inViewIO.unobserve(entry.target);
                    }
                  });
                }, { threshold: 0.2, rootMargin: "0px 0px -10% 0px" });
              }
              
              window.initInViewAnimations = function (selector = ".animate-on-scroll") {
                document.querySelectorAll(selector).forEach((el) => {
                  window.__inViewIO.observe(el);
                });
              };
              
              document.addEventListener("DOMContentLoaded", () => initInViewAnimations());
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
