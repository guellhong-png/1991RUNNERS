'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, MapPin, Search, X } from 'lucide-react'
import Link from 'next/link'

const EVENT_TYPES = [
  { value: 'run', label: '정기런' },
  { value: 'ddayrun', label: '뛰꼬양데이' },
  { value: 'event', label: '행사' },
  { value: 'race', label: '대회' },
  { value: 'social', label: '벙개' },
]

interface KakaoPlace {
  id: string
  place_name: string
  address_name: string
  road_address_name: string
  x: string
  y: string
  place_url: string
}

export default function NewEventPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', location: '', location_url: '',
    event_date: '', event_time: '', event_type: 'run',
  })
  const [locationQuery, setLocationQuery] = useState('')
  const [locationResults, setLocationResults] = useState<KakaoPlace[]>([])
  const [locationSearching, setLocationSearching] = useState(false)
  const [locationSelected, setLocationSelected] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  const searchLocation = async (query: string) => {
    if (!query.trim()) { setLocationResults([]); return }
    setLocationSearching(true)
    try {
      const res = await fetch(`/api/kakao-search?query=${encodeURIComponent(query)}`)
      const data = await res.json()
      setLocationResults(data.documents ?? [])
    } catch {
      setLocationResults([])
    }
    setLocationSearching(false)
  }

  useEffect(() => {
    if (locationSelected) return
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => searchLocation(locationQuery), 400)
    return () => clearTimeout(searchTimeout.current)
  }, [locationQuery, locationSelected])

  const handleSelectLocation = (place: KakaoPlace) => {
    const kakaoUrl = `https://map.kakao.com/link/map/${place.id}`
    const naverUrl = `https://map.naver.com/v5/search/${encodeURIComponent(place.place_name)}`
    setForm({
      ...form,
      location: place.place_name,
      location_url: kakaoUrl,
    })
    setLocationQuery(place.place_name)
    setLocationResults([])
    setLocationSelected(true)
  }

  const handleClearLocation = () => {
    setForm({ ...form, location: '', location_url: '' })
    setLocationQuery('')
    setLocationSelected(false)
    setLocationResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('events').insert({
      title: form.title, description: form.description,
      location: form.location, location_url: form.location_url,
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">모임 종류 *</label>
            <div className="grid grid-cols-5 gap-2">
              {EVENT_TYPES.map(({ value, label }) => (
                <button key={value} type="button"
                  onClick={() => setForm({...form, event_type: value})}
                  className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors ${form.event_type === value ? 'bg-[#c0392b] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">모임 제목 *</label>
            <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="input" placeholder="예: 한강 정기런" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">날짜 *</label>
              <input type="date" value={form.event_date} onChange={(e) => setForm({...form, event_date: e.target.value})} className="input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시간 *</label>
              <input type="time" value={form.event_time} onChange={(e) => setForm({...form, event_time: e.target.value})} className="input" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">장소 *</label>
            <div className="relative">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={locationQuery}
                  onChange={(e) => { setLocationQuery(e.target.value); setLocationSelected(false) }}
                  className="input pl-9 pr-9"
                  placeholder="장소 검색 (예: 여의도 한강공원)"
                  required
                />
                {locationQuery && (
                  <button type="button" onClick={handleClearLocation} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                )}
              </div>
              {locationResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto mt-1">
                  {locationResults.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleSelectLocation(place)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-[#c0392b] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{place.place_name}</p>
                          <p className="text-xs text-gray-400">{place.road_address_name || place.address_name}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {locationSearching && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 px-4 py-3 mt-1">
                  <p className="text-sm text-gray-400">검색 중...</p>
                </div>
              )}
            </div>
            {form.location_url && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <MapPin size={12} />장소가 선택되었습니다
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상세 내용</label>
            <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="input h-28 resize-none" placeholder="거리, 페이스, 준비물 등" />
          </div>
          <div className="flex gap-3 pt-2">
            <Link href="/calendar" className="btn-secondary flex-1 text-center py-3">취소</Link>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 disabled:opacity-50">{loading ? '등록 중...' : '모임 등록'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
