import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { Plus, Pin } from 'lucide-react'

export default async function BoardPage() {
  const supabase = await createClient()
  const { data: posts } = await supabase.from('posts').select('*, author:profiles!author_id(name)').order('is_pinned', { ascending: false }).order('created_at', { ascending: false })
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">공지 게시판</h1><p className="text-gray-500 mt-1">클럽 소식과 공지사항을 확인하세요</p></div>
        <Link href="/board/new"><button className="btn-primary flex items-center gap-2"><Plus size={18} />글쓰기</button></Link>
      </div>
      <div className="card p-0 overflow-hidden">
        {(!posts || posts.length === 0) ? (
          <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-3">📢</p><p>등록된 공지가 없습니다</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((post) => (
              <Link key={post.id} href={`/board/${post.id}`}>
                <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  {post.is_pinned && <Pin size={15} className="text-[#e94560] shrink-0" />}
                  <div className="flex-1 min-w-0"><p className={`font-medium truncate ${post.is_pinned ? 'text-[#e94560]' : 'text-gray-900'}`}>{post.is_pinned && '📌 '}{post.title}</p></div>
                  <div className="text-right shrink-0"><p className="text-xs text-gray-400">{post.author?.name ?? '알 수 없음'}</p><p className="text-xs text-gray-400 mt-0.5">{format(new Date(post.created_at), 'M/d', { locale: ko })}</p></div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
