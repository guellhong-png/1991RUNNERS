'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Calendar, Megaphone, Wallet, Settings, LogOut, Home, Users, BookOpen, ClipboardList, Archive, ChevronDown, ChevronRight, Newspaper, Star, MessageSquare, Menu, X, Pencil } from 'lucide-react'
import { useState } from 'react'

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [boardOpen, setBoardOpen] = useState(pathname.startsWith('/board'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: profile.name ?? '',
    phone: (profile as any).phone ?? '',
    birthday: (profile as any).birthday ?? '',
    instagram: (profile as any).instagram ?? '',
    pb_full: (profile as any).pb_full ?? '',
    pb_10k: (profile as any).pb_10k ?? '',
    bio: (profile as any).bio ?? '',
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleProfileSave = async () => {
    setProfileSaving(true)
    await supabase.from('profiles').update(profileForm).eq('id', profile.id)
    setProfileSaving(false)
    setEditProfileOpen(false)
    router.refresh()
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const NavItem = ({ href, icon, label, adminOnly = false }: { href: string; icon: React.ReactNode; label: string; adminOnly?: boolean }) => {
    if (adminOnly && profile.role !== 'admin') return null
    return (
      <Link href={href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive(href) ? 'bg-[#c0392b] text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
        {icon}{label}
      </Link>
    )
  }

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-white/10">
        <img src="https://kvotmnyktvgqlplfbuqh.supabase.co/storage/v1/object/public/club-images/1991.jpeg" alt="1991RUNNERS" className="w-10 h-10 rounded-lg" />
      </div>
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#c0392b] flex items-center justify-center text-sm font-bold shrink-0">{profile.name[0]}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{profile.name}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded ${profile.role === 'admin' ? 'bg-yellow-400/20 text-yellow-300' : 'bg-white/10 text-gray-400'}`}>
              {profile.role === 'admin' ? '운영진' : (profile as any).grade || '준회원'}
            </span>
          </div>
          <button onClick={() => setEditProfileOpen(true)} className="text-gray-400 hover:text-white transition-colors shrink-0">
            <Pencil size={14} />
          </button>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavItem href="/dashboard" icon={<Home size={18} />} label="홈" />
        <NavItem href="/about" icon={<BookOpen size={18} />} label="뛰꼬양 소개" />
        <NavItem href="/profile" icon={<Users size={18} />} label="회원 프로필" />
        <NavItem href="/calendar" icon={<Calendar size={18} />} label="뛰꼬양 캘린더" />
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
              <Link href="/board/news" onClick={() => setMobileOpen(false)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${isActive('/board/news') ? 'bg-[#c0392b] text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                <Newspaper size={14} />뛰꼬양 소식
              </Link>
              <Link href="/board/notice" onClick={() => setMobileOpen(false)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${isActive('/board/notice') ? 'bg-[#c0392b] text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                <Star size={14} />뛰꼬양 필독사항
              </Link>
              <Link href="/board/free" onClick={() => setMobileOpen(false)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${isActive('/board/free') ? 'bg-[#c0392b] text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
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
    </>
  )

  return (
    <>
      {/* 모바일 상단 헤더 */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black text-white flex items-center justify-between px-4 py-3 border-b border-white/10">
        <img src="https://kvotmnyktvgqlplfbuqh.supabase.co/storage/v1/object/public/club-images/1991.jpeg" alt="1991RUNNERS" className="w-8 h-8 rounded-lg" />
        <button onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 모바일 드로어 */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-64 bg-black text-white flex flex-col min-h-screen overflow-y-auto mt-12">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* PC 사이드바 */}
      <aside className="hidden md:flex w-64 bg-black text-white flex-col min-h-screen shrink-0">
        <SidebarContent />
      </aside>

      {/* 본인 정보 수정 모달 */}
      {editProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditProfileOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">내 정보 수정</h2>
              <button onClick={() => setEditProfileOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: '이름', key: 'name' },
                { label: '전화번호', key: 'phone' },
                { label: '생일 (YYYY-MM-DD)', key: 'birthday' },
                { label: '인스타그램', key: 'instagram' },
                { label: '풀마라톤 PB', key: 'pb_full' },
                { label: '10K PB', key: 'pb_10k' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-sm text-gray-600 mb-1 block">{label}</label>
                  <input
                    value={(profileForm as any)[key] ?? ''}
                    onChange={e => setProfileForm({ ...profileForm, [key]: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c0392b] text-gray-900"
                  />
                </div>
              ))}
              <div>
                <label className="text-sm text-gray-600 mb-1 block">자기소개</label>
                <textarea
                  value={profileForm.bio ?? ''}
                  onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c0392b] text-gray-900 resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end p-6 border-t">
              <button onClick={() => setEditProfileOpen(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">취소</button>
              <button onClick={handleProfileSave} disabled={profileSaving} className="px-4 py-2 bg-[#c0392b] text-white text-sm rounded-lg hover:bg-[#a93226] disabled:opacity-50">
                {profileSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
