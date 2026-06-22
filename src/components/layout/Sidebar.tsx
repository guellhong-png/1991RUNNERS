'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Calendar, Megaphone, Wallet, Users, LogOut, Home, Settings } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: '홈', icon: <Home size={20} /> },
  { href: '/calendar', label: '캘린더', icon: <Calendar size={20} /> },
  { href: '/board', label: '공지 게시판', icon: <Megaphone size={20} /> },
  { href: '/finance', label: '회비 내역', icon: <Wallet size={20} /> },
  { href: '/admin', label: '관리자', icon: <Settings size={20} />, adminOnly: true },
]

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-[#1a1a2e] text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold">🏃 뛰꼬양</h1>
        <p className="text-xs text-gray-400 mt-1">러닝 클럽</p>
      </div>
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#e94560] flex items-center justify-center text-sm font-bold">{profile.name[0]}</div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{profile.name}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded ${profile.role === 'admin' ? 'bg-yellow-400/20 text-yellow-300' : 'bg-white/10 text-gray-400'}`}>
              {profile.role === 'admin' ? '운영진' : '회원'}
            </span>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          if (item.adminOnly && profile.role !== 'admin') return null
          const isActive = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-[#e94560] text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
              {item.icon}{item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-colors w-full">
          <LogOut size={20} />로그아웃
        </button>
      </div>
    </aside>
  )
}
