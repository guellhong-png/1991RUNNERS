'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewPostPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', is_pinned: false })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('posts').insert({ title: form.title, content: form.content, is_pinned: form.is_pinned, author_id: user?.id })
    if (!error) { router.push('/board'); router.refresh() }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6"><Link href="/board" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link><h1 className="text-2xl font-bold text-gray-900">글쓰기</h1></div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label><input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="input" placeholder="제목을 입력하세요" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">내용 *</label><textarea value={form.content} onChange={(e) => setForm({...form, content: e.target.value})} className="input h-52 resize-none" placeholder="내용을 입력하세요" required /></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pinned" checked={form.is_pinned} onChange={(e) => setForm({...form, is_pinned: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-[#e94560]" />
            <label htmlFor="pinned" className="text-sm text-gray-600 cursor-pointer">📌 상단 고정</label>
          </div>
          <div className="flex gap-3 pt-2"><Link href="/board" className="btn-secondary flex-1 text-center py-3">취소</Link><button type="submit" disabled={loading} className="btn-primary flex-1 py-3 disabled:opacity-50">{loading ? '등록 중...' : '게시글 등록'}</button></div>
        </form>
      </div>
    </div>
  )
}
