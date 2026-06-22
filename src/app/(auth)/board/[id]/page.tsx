import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import DeletePostButton from './DeletePostButton'

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
  const { data: post } = await supabase.from('posts').select('*, author:profiles!author_id(id, name)').eq('id', params.id).single()
  if (!post) notFound()
  const canDelete = profile?.role === 'admin' || post.author_id === user?.id
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6"><Link href="/board" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link><h1 className="text-xl font-bold text-gray-900 flex-1">{post.is_pinned && '📌 '}{post.title}</h1>{canDelete && <DeletePostButton postId={post.id} />}</div>
      <div className="card">
        <div className="flex items-center justify-between text-sm text-gray-500 border-b border-gray-100 pb-4 mb-6"><span>{post.author?.name ?? '알 수 없음'}</span><span>{format(new Date(post.created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}</span></div>
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
      </div>
    </div>
  )
}
