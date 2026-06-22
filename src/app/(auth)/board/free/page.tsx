import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function FreePage() {
  const supabase = await createClient()
  const { data: posts } = await supabase.from('posts').select('*, author:profiles!author_id(name)')
    .eq('category', 'free').order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">자유게시판</h1><p className="text-gray-500 mt-1">자유롭게 소통해요</p></div>
        <Link href="/board/free/new"><button className="btn-primary flex items-center gap-2"><Plus size={18} />글쓰기</button></Link>
      </div>
      <div className="card p-0 overflow-hidden">
        {(!posts || posts.length === 0) ? (
          <div className="text-center py-16 text-gray-400"><p className="text-4xl mb-3">💬</p><p>첫 번째 글을 작성해보세요!</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((post) => (
              <Link key={post.id} href={`/board/${post.id}`}>
                <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0"><p className="font-medium text-gray-900 truncate">{post.title}</p></div>
                  <div className="text-right shrink-0"><p className="text-xs text-gray-400">{post.author?.name}</p><p className="text-xs text-gray-400 mt-0.5">{format(new Date(post.created_at), 'M/d', { locale: ko })}</p></div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
