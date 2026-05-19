import type { Metadata, Viewport } from 'next';
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

/**
 * iOS-aware viewport. `viewport-fit: cover` is the bit that matters — it
 * tells iOS Safari to expose real `env(safe-area-inset-*)` values so the
 * lesson topbar can pad itself below the notch / status bar. Without this,
 * `env(safe-area-inset-top)` falls back to 0 and the topbar collapses up
 * under the iOS chrome. Chrome DevTools mobile preview doesn't simulate
 * this — the bug only shows on the real iOS Simulator or device.
 *
 * `themeColor` paints the iOS Safari URL-bar surround so the cosmos
 * background reads as edge-to-edge instead of a white seam at the top.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#050a20',
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
      data-scroll-behavior="smooth"
    >
      <body>{children}</body>
    </html>
  );
}
