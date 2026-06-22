import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import DeletePostButton from './DeletePostButton'

const CATEGORY_BACK: Record<string, string> = {
  news: '/board/news',
  notice: '/board/notice',
  free: '/board/free',
}
const CATEGORY_LABEL: Record<string, string> = {
  news: '뛰꼬양 소식', notice: '뛰꼬양 필독사항', free: '자유게시판',
}

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const { data: post } = await supabase.from('posts').select('*, author:profiles!author_id(id, name)').eq('id', id).single()
  if (!post) notFound()
  const canDelete = profile?.role === 'admin' || post.author_id === user?.id
  const backUrl = CATEGORY_BACK[post.category] || '/board/news'

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={backUrl} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-1">{CATEGORY_LABEL[post.category]}</p>
          <h1 className="text-xl font-bold text-gray-900">{post.is_pinned && '📌 '}{post.title}</h1>
        </div>
        {canDelete && <DeletePostButton postId={post.id} backUrl={backUrl} />}
      </div>
      <div className="card">
        <div className="flex items-center justify-between text-sm text-gray-500 border-b border-gray-100 pb-4 mb-6">
          <span>{post.author?.name ?? '알 수 없음'}</span>
          <span>{format(new Date(post.created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}</span>
        </div>
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
      </div>
    </div>
  )
}
