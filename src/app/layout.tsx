import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '뛰꼬양 러닝 클럽',
  description: '뛰꼬양 러닝 클럽 회원 전용 페이지',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '뛰꼬양',
  },
  themeColor: '#c0392b',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="뛰꼬양" />
        <meta name="theme-color" content="#c0392b" />
        <link rel="apple-touch-icon" href="/icon-512.png" />
        <script dangerouslySetInnerHTML={{
          __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js')) }`
        }} />
      </head>
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{children}</body>
    </html>
  )
}
