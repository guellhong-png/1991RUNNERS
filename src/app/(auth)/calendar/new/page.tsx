'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EventType, EVENT_TYPE_LABELS } from '@/types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewEventPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', location: '', event_date: '', event_time: '', event_type: 'run' as EventType })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('events').insert({
      title: form.title, description: form.description, location: form.location,
      event_date: `${form.event_date}T${form.event_time}:00`,
      event_type: form.event_type, created_by: user?.id,
    })
    if (!error) { router.push('/calendar'); router.refresh() }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/calendar" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-gray-900">새 모임 만들기</h1>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">모임 제목 *</label><input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="input" placeholder="예: 한강 주말 러닝" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">모임 종류 *</label>
            <select value={form.event_type} onChange={(e) => setForm({...form, event_type: e.target.value as EventType})} className="input">
              {Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">날짜 *</label><input type="date" value={form.event_date} onChange={(e) => setForm({...form, event_date: e.target.value})} className="input" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">시간 *</label><input type="time" value={form.event_time} onChange={(e) => setForm({...form, event_time: e.target.value})} className="input" required /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">장소 *</label><input value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} className="input" placeholder="예: 여의도 한강공원 물빛광장 앞" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">상세 내용</label><textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="input h-28 resize-none" placeholder="거리, 페이스, 준비물 등" /></div>
          <div className="flex gap-3 pt-2">
            <Link href="/calendar" className="btn-secondary flex-1 text-center py-3">취소</Link>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 disabled:opacity-50">{loading ? '등록 중...' : '모임 등록'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
