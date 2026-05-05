import type { Metadata, Viewport } from 'next';
import './globals.css';
import './skins.css';
import { Toaster } from '@/components/ui/sonner';
import { PageTransition } from '@/components/shared/page-transition';

const SITE_TITLE = 'Fadlet — 워크숍 OS · 한 화면에서 운영하는 협업 보드';
const SITE_DESCRIPTION = '보드형 7종 + 라이브 3종 + 단계 시퀀스 + 통합 리포트. 워크숍의 처음부터 끝까지, Fadlet 하나로.';

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  metadataBase: new URL('https://fadlet.vercel.app'),
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: 'https://fadlet.vercel.app',
    siteName: 'Fadlet',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Fadlet — 워크숍 OS' }],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-full flex flex-col antialiased"
        style={{ fontFamily: "'Pretendard Variable', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}
      >
        <PageTransition>{children}</PageTransition>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
