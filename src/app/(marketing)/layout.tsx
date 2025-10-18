import { Inter } from 'next/font/google';
import { MarketingNav } from '@/components/marketing/MarketingNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import '../marketing/animations.css';

const inter = Inter({ subsets: ['latin'] });

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.className} min-h-screen bg-black text-white antialiased`}>
      {/* Background image */}
      <div 
        className="absolute top-0 w-full -z-10 h-screen bg-cover bg-center opacity-50"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80")',
        }}
      />

      {/* Gradient blur effect */}
      <div className="gradient-blur">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>

      <div id="wrapper">
        <MarketingNav />
        <main className="overflow-hidden relative">{children}</main>
        <MarketingFooter />
      </div>

      {/* Scroll animation init script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              if (!window.__inViewIO) {
                window.__inViewIO = new IntersectionObserver((entries) => {
                  entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                      entry.target.classList.add("animate");
                      window.__inViewIO.unobserve(entry.target);
                    }
                  });
                }, { threshold: 0.2, rootMargin: "0px 0px -10% 0px" });
              }

              function initInViewAnimations() {
                document.querySelectorAll(".animate-on-scroll").forEach((el) => {
                  window.__inViewIO.observe(el);
                });
              }

              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initInViewAnimations);
              } else {
                initInViewAnimations();
              }
            })();
          `,
        }}
      />
    </div>
  );
}

