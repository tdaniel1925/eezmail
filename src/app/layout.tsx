import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { BackgroundEffects } from '@/components/layout/BackgroundEffects';
import { ThemeProvider } from 'next-themes';
import { DatabaseHealthProvider } from '@/components/providers/DatabaseHealthProvider';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'easeMail - AI-Powered Email for Enterprises | Save 10 Hours Per Week',
  description: 'The fastest, most intelligent email client for teams. AI-powered productivity, enterprise security, and 50% less cost than Superhuman. Start your free trial today.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <BackgroundEffects />
          {children}
          <Toaster
            position="top-right"
            expand={true}
            richColors
            closeButton
            theme="system"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
