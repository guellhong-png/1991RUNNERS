'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewFreePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('posts').insert({ title: form.title, content: form.content, category: 'free', is_pinned: false, author_id: user?.id })
    router.push('/board/free'); router.refresh()
    setLoading(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6"><Link href="/board/free" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link><h1 className="text-2xl font-bold text-gray-900">자유게시판 글쓰기</h1></div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label><input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="input" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">내용 *</label><textarea value={form.content} onChange={(e) => setForm({...form, content: e.target.value})} className="input h-52 resize-none" required /></div>
          <div className="flex gap-3 pt-2"><Link href="/board/free" className="btn-secondary flex-1 text-center py-3">취소</Link><button type="submit" disabled={loading} className="btn-primary flex-1 py-3 disabled:opacity-50">{loading ? '등록 중...' : '등록'}</button></div>
        </form>
      </div>
    </div>
  )
}
