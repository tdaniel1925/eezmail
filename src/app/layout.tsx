import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { BackgroundEffects } from '@/components/layout/BackgroundEffects';
import { ThemeProvider } from 'next-themes';
import { DatabaseHealthProvider } from '@/components/providers/DatabaseHealthProvider';
import { SWRProvider } from '@/providers/SWRProvider';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'easeMail - AI-Powered Email for Enterprises | Save 10 Hours Per Week',
  description:
    'The fastest, most intelligent email client for teams. AI-powered productivity, enterprise security, and 50% less cost than Superhuman. Start your free trial today.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* CRITICAL: Install fetch sanitizer BEFORE any other JavaScript */}
        <Script
          id="fetch-sanitizer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  if (typeof window !== 'undefined' && window.fetch) {
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
      if (init && init.headers) {
        const sanitized = {};
        if (init.headers instanceof Headers) {
          init.headers.forEach(function(v, k) {
            sanitized[k] = v.replace(/[^\\x00-\\x7F]/g, '');
          });
          init.headers = sanitized;
        } else if (Array.isArray(init.headers)) {
          init.headers = init.headers.map(function(p) {
            return [p[0], typeof p[1] === 'string' ? p[1].replace(/[^\\x00-\\x7F]/g, '') : p[1]];
          });
        } else {
          Object.keys(init.headers).forEach(function(k) {
            var v = init.headers[k];
            sanitized[k] = typeof v === 'string' ? v.replace(/[^\\x00-\\x7F]/g, '') : v;
          });
          init.headers = sanitized;
        }
      }
      return originalFetch.call(this, input, init);
    };
    console.log('[FETCH] Sanitizer active');
  }
})();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} ${playfair.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SWRProvider>
            <BackgroundEffects />
            {children}
            <Toaster
              position="top-right"
              expand={true}
              richColors
              closeButton
              theme="system"
              toastOptions={{
                style: {
                  animation: 'none',
                },
                className: 'sonner-toast-no-animation',
              }}
            />
          </SWRProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
