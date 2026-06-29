'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Upload } from 'lucide-react'

const ACTIVITY_TYPES = [
  { value: 'run', label: '🏃 로드' },
  { value: 'trail', label: '🏔️ 트레일' },
]

interface Props {
  userId: string
  onClose: () => void
  onComplete: () => void
}

export default function GpxUploadModal({ userId, onClose, onComplete }: Props) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    activity_type: 'run',
    distance: '',
    duration_h: '',
    duration_m: '',
    duration_s: '',
    avg_pace_m: '',
    avg_pace_s: '',
    elevation_gain: '',
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setFileName(file.name)
  }

  const handleSubmit = async () => {
    if (!form.title || !fileRef.current?.files?.[0]) {
      alert('제목과 GPX 파일은 필수입니다')
      return
    }
    setLoading(true)

    const file = fileRef.current.files[0]
    const path = `${userId}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage.from('gpx-files').upload(path, file)
    if (uploadError) { alert('파일 업로드 실패: ' + uploadError.message); setLoading(false); return }

    const { data: urlData } = supabase.storage.from('gpx-files').getPublicUrl(path)

    const durationSeconds = form.duration_h || form.duration_m || form.duration_s
      ? (parseInt(form.duration_h || '0') * 3600) + (parseInt(form.duration_m || '0') * 60) + parseInt(form.duration_s || '0')
      : null

    const avgPaceSeconds = form.avg_pace_m || form.avg_pace_s
      ? (parseInt(form.avg_pace_m || '0') * 60) + parseInt(form.avg_pace_s || '0')
      : null

    const { error } = await supabase.from('gpx_routes').insert({
      user_id: userId,
      title: form.title,
      description: form.description || null,
      activity_type: form.activity_type,
      distance: form.distance ? parseFloat(form.distance) : null,
      duration: durationSeconds,
      avg_pace: avgPaceSeconds,
      elevation_gain: form.elevation_gain ? parseFloat(form.elevation_gain) : null,
      gpx_url: urlData.publicUrl,
    })

    if (error) { alert('저장 실패: ' + error.message); setLoading(false); return }
    setLoading(false)
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">GPX 업로드</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* 활동 종류 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">활동 종류</label>
            <div className="flex gap-2">
              {ACTIVITY_TYPES.map(t => (
                <button key={t.value} type="button"
                  onClick={() => setForm({ ...form, activity_type: t.value })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.activity_type === t.value ? 'bg-[#c0392b] text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">제목 *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="예: 한강 조깅 코스"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c0392b]" />
          </div>

          {/* 설명 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">설명</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="코스 설명, 난이도, 특징 등"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c0392b] resize-none" />
          </div>

          {/* 거리 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">거리 (km)</label>
            <input type="number" step="0.01" value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })}
              placeholder="예: 25.66"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c0392b]" />
          </div>

          {/* 시간 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">시간</label>
            <div className="flex gap-2 items-center">
              <input type="number" value={form.duration_h} onChange={e => setForm({ ...form, duration_h: e.target.value })}
                placeholder="시" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c0392b]" />
              <span className="text-gray-400 text-sm">:</span>
              <input type="number" value={form.duration_m} onChange={e => setForm({ ...form, duration_m: e.target.value })}
                placeholder="분" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c0392b]" />
              <span className="text-gray-400 text-sm">:</span>
              <input type="number" value={form.duration_s} onChange={e => setForm({ ...form, duration_s: e.target.value })}
                placeholder="초" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c0392b]" />
            </div>
          </div>

          {/* 평균 페이스 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">평균 페이스 (/km)</label>
            <div className="flex gap-2 items-center">
              <input type="number" value={form.avg_pace_m} onChange={e => setForm({ ...form, avg_pace_m: e.target.value })}
                placeholder="분" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c0392b]" />
              <span className="text-gray-400 text-sm">:</span>
              <input type="number" value={form.avg_pace_s} onChange={e => setForm({ ...form, avg_pace_s: e.target.value })}
                placeholder="초" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c0392b]" />
            </div>
          </div>

          {/* 누적 상승 고도 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">누적 상승 고도 (m)</label>
            <input type="number" value={form.elevation_gain} onChange={e => setForm({ ...form, elevation_gain: e.target.value })}
              placeholder="예: 320"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c0392b]" />
          </div>

          {/* GPX 파일 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">GPX 파일 *</label>
            <input ref={fileRef} type="file" accept=".gpx" className="hidden" onChange={handleFileChange} />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-lg py-4 flex flex-col items-center gap-2 text-gray-400 hover:border-gray-300 transition-colors">
              <Upload size={20} />
              <span className="text-sm">{fileName || 'GPX 파일 선택'}</span>
            </button>
          </div>
        </div>

        <div className="flex gap-2 p-5 border-t">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">취소</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-[#c0392b] text-white rounded-xl text-sm font-medium hover:bg-[#a93226] disabled:opacity-50">
            {loading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      </div>
    </div>
  )
}
