import Script from 'next/script';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { ParticlesBackground } from '@/components/marketing/ParticlesBackground';
import { GradientBlur } from '@/components/marketing/GradientBlur';
import '@/components/marketing/template-animations.css';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Particles Background */}
      <div className="aura-background-component z-10 mix-blend-screen w-full h-screen absolute top-0 pointer-events-none">
        <ParticlesBackground />
      </div>

      {/* Marketing Content */}
      <div className="relative min-h-screen">
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
    </>
  );
}
