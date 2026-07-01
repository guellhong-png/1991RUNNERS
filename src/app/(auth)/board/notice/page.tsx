import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { Plus, Pin } from 'lucide-react'
import { NOTICE_ITEMS } from '@/types'

export default async function NoticePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const { data: posts } = await supabase.from('posts').select('*, author:profiles!author_id(name)')
    .eq('category', 'notice').order('is_pinned', { ascending: false }).order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">뛰꼬양 필독사항</h1><p className="text-gray-500 mt-1">반드시 읽어주세요</p></div>
        {profile?.role === 'admin' && (
          <Link href="/board/notice/new"><button className="btn-primary flex items-center gap-2"><Plus size={18} />글쓰기</button></Link>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Pin size={16} className="text-[#e94560]" />필독 목록</h2>
        <div className="space-y-2">
          {NOTICE_ITEMS.map((item) => {
  const post = posts?.find(p => p.title === item)
  return (
    <div key={item}>
      {post ? (
        <Link href={`/board/${post.id}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e94560] shrink-0"></span>
          <span className="text-sm font-medium text-gray-800">{item}</span>
          <span className="ml-auto text-xs text-green-500">✓ 등록됨</span>
        </Link>
      ) : (
        <div className="flex items-center gap-2 p-2 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0"></span>
          <span className="text-sm text-gray-400">{item}</span>
          {profile?.role === 'admin' && (
            <Link href={`/board/notice/new?title=${encodeURIComponent(item)}`} className="ml-auto text-xs text-blue-400 hover:underline">작성하기</Link>
          )}
        </div>
      )}
    </div>
  )
})}

            const post = posts?.find(p => p.title === item)
            return (
              <div key={item}>
                {post ? (
                  <Link href={`/board/${post.id}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e94560] shrink-0"></span>
                    <span className="text-sm font-medium text-gray-800">{item}</span>
                    <span className="ml-auto text-xs text-green-500">✓ 등록됨</span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0"></span>
                    <span className="text-sm text-gray-400">{item}</span>
                    {profile?.role === 'admin' && (
                      <Link href={`/board/notice/new?title=${encodeURIComponent(item)}`} className="ml-auto text-xs text-blue-400 hover:underline">작성하기</Link>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {posts && posts.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {posts.map((post) => (
              <Link key={post.id} href={`/board/${post.id}`}>
                <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <Pin size={14} className="text-[#e94560] shrink-0" />
                  <div className="flex-1 min-w-0"><p className="font-medium text-gray-900 truncate">{post.title}</p></div>
                  <div className="text-right shrink-0"><p className="text-xs text-gray-400">{format(new Date(post.created_at), 'M/d', { locale: ko })}</p></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
