import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: '뛰꼬양 러닝 클럽',
  description: '뛰꼬양 러닝 클럽 회원 전용 페이지',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{children}</body></html>
}
