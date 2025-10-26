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
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png' },
    ],
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
          {/* Fetch sanitizer removed - using Supabase client configuration instead */}
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
