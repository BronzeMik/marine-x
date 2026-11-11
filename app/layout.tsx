import type { Metadata, Viewport } from 'next';
import './globals.css';
import CartProvider from '../components/cart/CartProvider';
import { MotionProvider } from '../components/Motion';
import { shopEnabled } from '../lib/shopify/client';
import { SITE_URL } from '../lib/format';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'MARINE X | By Design. Not Default.', template: '%s | Marine X' },
  description: 'Everyday carry, gear reviews, and preparedness. Build a more intentional everyday with Marine X.',
  alternates: { canonical: '/' },
  openGraph: { siteName: 'Marine X', type: 'website' },
};
export const viewport: Viewport = { themeColor: '#101110' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <MotionProvider>
          <CartProvider enabled={shopEnabled}>{children}</CartProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
