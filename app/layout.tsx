import './globals.css'; // <--- THIS MUST BE HERE
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://vantakos.com'),
  title: 'VantakOS | Your Business. Your App. Live in Minutes.',
  description: 'Ending the gatekeeping of small business. Get the branded app, booking, and payment system your clients expect. You craft. We work.',
  keywords: 'small business OS, online booking for trades, mobile payments for artisans, professional recordkeeping app, no-gatekeeping business tech, service business platform, PWA for small business, booking system for local businesses, payment processing for entrepreneurs, business management software',
  icons: {
    icon: '/logo.png',
  },
  openGraph: {
    title: 'VantakOS | Your Business. Your App. Live in Minutes.',
    description: 'Get your business its own app and professional back-office in minutes. all. in. one.',
    type: 'website',
    url: 'https://vantakos.com',
    siteName: 'VantakOS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VantakOS | Your Business. Your App. Live in Minutes.',
    description: 'Get your business its own app and professional back-office in minutes. all. in. one.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

