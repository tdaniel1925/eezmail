import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
            />
          </SWRProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
