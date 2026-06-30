'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { RichTextEditor } from '@/lib/RichTextEditor'

export default function NewArchivePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('posts').insert({ title: form.title, content: form.content, category: 'archive', is_pinned: false, author_id: user?.id })
    router.push('/board/archive')
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/board/archive" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-gray-900">자료실 작성</h1>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">내용 *</label>
            <RichTextEditor value={form.content} onChange={(v) => setForm({ ...form, content: v })} rows={10} />
          </div>
          <div className="flex gap-3 pt-2">
            <Link href="/board/archive" className="btn-secondary flex-1 text-center py-3">취소</Link>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 disabled:opacity-50">{loading ? '등록 중...' : '등록'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
