import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { InterviewProvider } from './context/InterviewContext';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { MotionProvider } from '@/components/MotionProvider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Prevent FOIT (Flash of Invisible Text)
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Preply - AI Interview Practice',
  description: 'Practice interviews with AI-powered feedback',
  openGraph: {
    images: [
      {
        url: '/og_default.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: '/og_default.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get Supabase URL for preconnect
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseDomain = supabaseUrl ? new URL(supabaseUrl).origin : '';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to critical third-party origins */}
        {supabaseDomain && (
          <>
            <link rel="preconnect" href={supabaseDomain} />
            <link rel="dns-prefetch" href={supabaseDomain} />
          </>
        )}
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <SubscriptionProvider>
            <InterviewProvider>
              <MotionProvider>
                {children}
              </MotionProvider>
            </InterviewProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
