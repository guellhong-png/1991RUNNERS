'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', phone: '', birthday: '', pb_full: '', pb_10k: '', instagram: '', bio: ''
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setForm({
        name: data.name || '',
        phone: data.phone || '',
        birthday: data.birthday || '',
        pb_full: data.pb_full || '',
        pb_10k: data.pb_10k || '',
        instagram: data.instagram || '',
        bio: data.bio || '',
      })
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({
      name: form.name,
      phone: form.phone || null,
      birthday: form.birthday || null,
      pb_full: form.pb_full || null,
      pb_10k: form.pb_10k || null,
      instagram: form.instagram || null,
      bio: form.bio || null,
    }).eq('id', user!.id)
    router.push('/profile')
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profile" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-gray-900">내 프로필 수정</h1>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
              <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
              <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="input" placeholder="010-0000-0000" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">생일</label>
            <input type="date" value={form.birthday} onChange={(e) => setForm({...form, birthday: e.target.value})} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PB (풀마라톤)</label>
              <input value={form.pb_full} onChange={(e) => setForm({...form, pb_full: e.target.value})} className="input" placeholder="예: 3:45:00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PB (10K)</label>
              <input value={form.pb_10k} onChange={(e) => setForm({...form, pb_10k: e.target.value})} className="input" placeholder="예: 52:30" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">인스타그램 아이디</label>
            <input value={form.instagram} onChange={(e) => setForm({...form, instagram: e.target.value})} className="input" placeholder="@아이디" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">한줄 소개</label>
            <textarea value={form.bio} onChange={(e) => setForm({...form, bio: e.target.value})} className="input h-20 resize-none" placeholder="자신을 소개해주세요" />
          </div>
          <p className="text-xs text-gray-400">* 등급은 운영진만 변경할 수 있습니다</p>
          <div className="flex gap-3 pt-2">
            <Link href="/profile" className="btn-secondary flex-1 text-center py-3">취소</Link>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 disabled:opacity-50">{loading ? '저장 중...' : '저장'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
