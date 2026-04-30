import type { Metadata, Viewport } from 'next';
import './globals.css';
import './skins.css';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Fadlet — 워크숍 운영자를 위한 협업 보드',
  description: '가입 없이 6자리 코드로 즉시 합류. 보드와 채팅을 한 화면에서.',
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
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
