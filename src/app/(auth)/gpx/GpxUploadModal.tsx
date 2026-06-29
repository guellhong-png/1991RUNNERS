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

const parseGPX = (text: string) => {
  const parser = new DOMParser()
  const xml = parser.parseFromString(text, 'application/xml')
  const trkpts = Array.from(xml.querySelectorAll('trkpt'))
  if (trkpts.length === 0) return null

  let distance = 0
  let elevationGain = 0
  let prevLat: number | null = null
  let prevLon: number | null = null
  let prevEle: number | null = null

  const times: Date[] = []

  trkpts.forEach(pt => {
    const lat = parseFloat(pt.getAttribute('lat') || '0')
    const lon = parseFloat(pt.getAttribute('lon') || '0')
    const ele = parseFloat(pt.querySelector('ele')?.textContent || '0')
    const timeStr = pt.querySelector('time')?.textContent
    if (timeStr) times.push(new Date(timeStr))

    if (prevLat !== null && prevLon !== null) {
      const R = 6371000
      const dLat = (lat - prevLat) * Math.PI / 180
      const dLon = (lon - prevLon) * Math.PI / 180
      const a = Math.sin(dLat/2) ** 2 + Math.cos(prevLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLon/2) ** 2
      distance += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    }

    if (prevEle !== null && ele > prevEle) {
      elevationGain += ele - prevEle
    }

    prevLat = lat
    prevLon = lon
    prevEle = ele
  })

  const distanceKm = distance / 1000
  let duration = null
  let avgPace = null

  if (times.length >= 2) {
    duration = Math.round((times[times.length-1].getTime() - times[0].getTime()) / 1000)
    if (distanceKm > 0) avgPace = Math.round(duration / distanceKm)
  }

  return {
    distance: Math.round(distanceKm * 100) / 100,
    duration,
    avg_pace: avgPace,
    elevation_gain: Math.round(elevationGain),
  }
}

export default function GpxUploadModal({ userId, onClose, onComplete }: Props) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [parsed, setParsed] = useState<{ distance: number; duration: number | null; avg_pace: number | null; elevation_gain: number } | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    activity_type: 'run',
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const text = await file.text()
    const result = parseGPX(text)
    if (result) setParsed(result)
  }

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const formatPace = (paceSeconds: number) => {
    const m = Math.floor(paceSeconds / 60)
    const s = paceSeconds % 60
    return `${m}:${String(s).padStart(2, '0')}/km`
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

    const { error } = await supabase.from('gpx_routes').insert({
      user_id: userId,
      title: form.title,
      description: form.description || null,
      activity_type: form.activity_type,
      distance: parsed?.distance ?? null,
      duration: parsed?.duration ?? null,
      avg_pace: parsed?.avg_pace ?? null,
      elevation_gain: parsed?.elevation_gain ?? null,
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

          {/* 파싱 결과 미리보기 */}
          {parsed && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-gray-500 mb-2">📊 GPX에서 읽어온 데이터</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">{parsed.distance} km</p>
                  <p className="text-xs text-gray-400">거리</p>
                </div>
                {parsed.duration && (
                  <div>
                    <p className="text-sm font-bold text-gray-900">{formatDuration(parsed.duration)}</p>
                    <p className="text-xs text-gray-400">시간</p>
                  </div>
                )}
                {parsed.avg_pace && (
                  <div>
                    <p className="text-sm font-bold text-gray-900">{formatPace(parsed.avg_pace)}</p>
                    <p className="text-xs text-gray-400">평균 페이스</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-gray-900">{parsed.elevation_gain} m</p>
                  <p className="text-xs text-gray-400">누적 상승</p>
                </div>
              </div>
            </div>
          )}
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
