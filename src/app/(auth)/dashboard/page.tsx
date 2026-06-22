import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { Calendar, Wallet, Users } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: upcomingEvents } = await supabase.from('events').select('*, creator:profiles!created_by(name)').gte('event_date', new Date().toISOString()).order('event_date', { ascending: true }).limit(3)
  const { data: recentPosts } = await supabase.from('posts').select('*, author:profiles!author_id(name)').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(3)
  const { data: finances } = await supabase.from('finances').select('balance_after').order('transaction_date', { ascending: false }).limit(1)
  const { count: memberCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'member')
  const balance = finances?.[0]?.balance_after ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">안녕하세요! 👋</h1>
        <p className="text-gray-500 mt-1">뛰꼬양 러닝 클럽에 오신 것을 환영합니다</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/calendar"><div className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-500">다음 모임</span><Calendar size={20} className="text-blue-500" /></div>
          <p className="text-2xl font-bold text-gray-900">{upcomingEvents?.[0] ? format(new Date(upcomingEvents[0].event_date), 'M월 d일', { locale: ko }) : '-'}</p>
        </div></Link>
        <Link href="/finance"><div className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-500">현재 회비 잔액</span><Wallet size={20} className="text-green-500" /></div>
          <p className="text-2xl font-bold text-gray-900">{balance.toLocaleString()}원</p>
        </div></Link>
        <Link href="/admin"><div className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-500">활동 회원</span><Users size={20} className="text-purple-500" /></div>
          <p className="text-2xl font-bold text-gray-900">{memberCount ?? 0}명</p>
        </div></Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">다가오는 모임</h2>
            <Link href="/calendar" className="text-sm text-[#e94560] hover:underline">더보기</Link>
          </div>
          <div className="space-y-3">
            {(!upcomingEvents || upcomingEvents.length === 0) && <p className="text-sm text-gray-400">예정된 모임이 없습니다</p>}
            {upcomingEvents?.map((event) => (
              <Link key={event.id} href={`/calendar/${event.id}`}>
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-center min-w-10">
                    <p className="text-xs text-gray-400">{format(new Date(event.event_date), 'M월', { locale: ko })}</p>
                    <p className="text-xl font-bold text-[#e94560]">{format(new Date(event.event_date), 'd')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-400">{event.location} · {format(new Date(event.event_date), 'HH:mm')}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">최근 공지</h2>
            <Link href="/board" className="text-sm text-[#e94560] hover:underline">더보기</Link>
          </div>
          <div className="space-y-3">
            {(!recentPosts || recentPosts.length === 0) && <p className="text-sm text-gray-400">공지사항이 없습니다</p>}
            {recentPosts?.map((post) => (
              <Link key={post.id} href={`/board/${post.id}`}>
                <div className="flex items-start gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  {post.is_pinned && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium shrink-0">📌 고정</span>}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{post.title}</p>
                    <p className="text-xs text-gray-400">{format(new Date(post.created_at), 'M/d', { locale: ko })}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
