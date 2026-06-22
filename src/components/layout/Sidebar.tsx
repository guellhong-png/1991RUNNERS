'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Calendar, Megaphone, Wallet, Settings, LogOut, Home, Users, BookOpen, ClipboardList, Archive, ChevronDown, ChevronRight, Newspaper, Star, MessageSquare } from 'lucide-react'
import { useState } from 'react'

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [boardOpen, setBoardOpen] = useState(pathname.startsWith('/board'))

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const NavItem = ({ href, icon, label, adminOnly = false }: { href: string; icon: React.ReactNode; label: string; adminOnly?: boolean }) => {
    if (adminOnly && profile.role !== 'admin') return null
    return (
      <Link href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive(href) ? 'bg-[#e94560] text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
        {icon}{label}
      </Link>
    )
  }

  return (
    <aside className="w-64 bg-[#1a1a2e] text-white flex flex-col min-h-screen shrink-0">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold">🏃 뛰꼬양</h1>
        <p className="text-xs text-gray-400 mt-1">러닝 클럽</p>
      </div>
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#e94560] flex items-center justify-center text-sm font-bold shrink-0">{profile.name[0]}</div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{profile.name}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded ${profile.role === 'admin' ? 'bg-yellow-400/20 text-yellow-300' : 'bg-white/10 text-gray-400'}`}>
              {profile.role === 'admin' ? '운영진' : (profile as any).grade || '준회원'}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavItem href="/dashboard" icon={<Home size={18} />} label="홈" />
        <NavItem href="/about" icon={<BookOpen size={18} />} label="뛰꼬양 소개" />
        <NavItem href="/profile" icon={<Users size={18} />} label="회원 프로필" />
        <NavItem href="/calendar" icon={<Calendar size={18} />} label="뛰꼬양 캘린더" />

        {/* 게시판 */}
        <div>
          <button
            onClick={() => setBoardOpen(!boardOpen)}
            className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${pathname.startsWith('/board') ? 'text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
          >
            <div className="flex items-center gap-3"><Megaphone size={18} />게시판</div>
            {boardOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {boardOpen && (
            <div className="ml-6 mt-1 space-y-1">
              <Link href="/board/news" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${isActive('/board/news') ? 'bg-[#e94560] text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                <Newspaper size={14} />뛰꼬양 소식
              </Link>
              <Link href="/board/notice" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${isActive('/board/notice') ? 'bg-[#e94560] text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                <Star size={14} />뛰꼬양 필독사항
              </Link>
              <Link href="/board/free" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${isActive('/board/free') ? 'bg-[#e94560] text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                <MessageSquare size={14} />자유게시판
              </Link>
            </div>
          )}
        </div>

        <NavItem href="/attendance" icon={<ClipboardList size={18} />} label="뛰꼬양 출석표" />
        <NavItem href="/finance" icon={<Wallet size={18} />} label="회비 내역" />
        <NavItem href="/archive" icon={<Archive size={18} />} label="뛰꼬양 자료실" />
        <NavItem href="/admin" icon={<Settings size={18} />} label="관리자" adminOnly />
      </nav>

      <div className="p-4 border-t border-white/10">
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-colors w-full">
          <LogOut size={18} />로그아웃
        </button>
      </div>
    </aside>
  )
}
