import type { Metadata } from 'next';
import { Work_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const workSans = Work_Sans({
  variable: '--font-work-sans',
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['300', '400'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Synthesis Tutor — Equivalent Fractions',
  description:
    'A short Montessori-style lesson on equivalent fractions. The material teaches; the adult observes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${workSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
