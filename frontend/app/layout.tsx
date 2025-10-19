import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';

const roboto = Roboto({
  subsets: ['latin', 'vietnamese'], 
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-roboto',  
});

export const metadata: Metadata = {
  title: 'Tashora',
  description: '',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${roboto.variable}`}>
      <body>{children}</body>
    </html>
  );
}