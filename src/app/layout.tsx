import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { BackgroundEffects } from '@/components/layout/BackgroundEffects';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Imbox - AI-Powered Email Client',
  description: 'Transform inbox chaos into actionable intelligence',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <BackgroundEffects />
        {children}
      </body>
    </html>
  );
}
