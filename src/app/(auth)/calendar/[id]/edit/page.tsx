'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, MapPin, Search, X, Image } from 'lucide-react'
import Link from 'next/link'

const EVENT_TYPES = [
  { value: 'run', label: '정기런' },
  { value: 'ddayrun', label: '뛰꼬양데이' },
  { value: 'event', label: '행사' },
  { value: 'race', label: '대회' },
  { value: 'social', label: '벙개' },
]

// 로컬 타임존 기준으로 YYYY-MM-DD, HH:mm 문자열을 만든다 (UTC 변환으로 인한 날짜/시간 어긋남 방지)
function toLocalDateStr(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
function toLocalTimeStr(date: Date) {
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${min}`
}

// "YYYY-MM-DD"와 "HH:mm"을 한국 로컬 시간으로 해석해 정확한 UTC ISO 문자열로 변환
function localToUtcIso(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [h, min] = timeStr.split(':').map(Number)
  const utcDate = new Date(Date.UTC(y, m - 1, d, h - 9, min, 0))
  return utcDate.toISOString()
}

interface KakaoPlace {
  id: string
  place_name: string
  address_name: string
  road_address_name: string
  x: string
  y: string
  place_url: string
}

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [eventId, setEventId] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', location: '', location_url: '',
    event_date: '', event_time: '', event_type: 'run',
    rsvp_deadline_date: '', rsvp_deadline_time: '', max_attendees: '',
  })
  const [locationQuery, setLocationQuery] = useState('')
  const [locationResults, setLocationResults] = useState<KakaoPlace[]>([])
  const [locationSearching, setLocationSearching] = useState(false)
  const [locationSelected, setLocationSelected] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      const { id } = await params
      setEventId(id)
      const { data } = await supabase.from('events').select('*').eq('id', id).single()
      if (data) {
        const date = new Date(data.event_date)
        const dateStr = toLocalDateStr(date)
        const timeStr = toLocalTimeStr(date)
        let rsvpDateStr = ''
        let rsvpTimeStr = ''
        if (data.rsvp_deadline) {
          const rsvpDate = new Date(data.rsvp_deadline)
          rsvpDateStr = toLocalDateStr(rsvpDate)
          rsvpTimeStr = toLocalTimeStr(rsvpDate)
        }
        setForm({
          title: data.title ?? '',
          description: data.description ?? '',
          location: data.location ?? '',
          location_url: data.location_url ?? '',
          event_date: dateStr,
          event_time: timeStr,
          event_type: data.event_type ?? 'run',
          rsvp_deadline_date: rsvpDateStr,
          rsvp_deadline_time: rsvpTimeStr,
          max_attendees: data.max_attendees ? String(data.max_attendees) : '',
        })
        setLocationQuery(data.location ?? '')
        setLocationSelected(true)
        setExistingImageUrl(data.image_url ?? null)
        setImagePreview(data.image_url ?? null)
      }
    }
    load()
  }, [])

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
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => searchLocation(locationQuery), 400)
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [locationQuery, locationSelected])

  const handleSelectLocation = (place: KakaoPlace) => {
    const kakaoUrl = `https://map.kakao.com/link/map/${place.id}`
    setForm({ ...form, location: place.place_name, location_url: kakaoUrl })
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 1024) {
      alert('이미지는 1MB 이하로 업로드해주세요.')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    let image_url = existingImageUrl
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('event-images').upload(path, imageFile)
      if (!uploadError) {
        const { data } = supabase.storage.from('event-images').getPublicUrl(path)
        image_url = data.publicUrl
      }
    } else if (!imagePreview) {
      image_url = null
    }

    const { error } = await supabase.from('events').update({
      title: form.title,
      description: form.description,
      location: form.location,
      location_url: form.location_url,
      event_date: localToUtcIso(form.event_date, form.event_time),
      event_type: form.event_type,
      image_url,
      is_edited: true,
      rsvp_deadline: form.rsvp_deadline_date && form.rsvp_deadline_time
        ? localToUtcIso(form.rsvp_deadline_date, form.rsvp_deadline_time)
        : null,
      max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
    }).eq('id', eventId)

    if (!error) {
      router.push(`/calendar/${eventId}`)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/calendar/${eventId}`} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-gray-900">모임 수정</h1>
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
                    <button key={place.id} type="button" onClick={() => handleSelectLocation(place)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
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
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><MapPin size={12} />장소가 선택되었습니다</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">참석 투표 마감 (선택)</label>
            <div className="grid grid-cols-2 gap-4">
              <input type="date" value={form.rsvp_deadline_date}
                onChange={(e) => setForm({ ...form, rsvp_deadline_date: e.target.value })}
                className="input" />
              <input type="time" value={form.rsvp_deadline_time}
                onChange={(e) => setForm({ ...form, rsvp_deadline_time: e.target.value })}
                className="input" />
            </div>
            <p className="text-xs text-gray-400 mt-1">설정하면 마감 시간 이후 참석 여부를 변경할 수 없어요</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">정원 (선택)</label>
            <input
              type="number"
              min="1"
              value={form.max_attendees}
              onChange={(e) => setForm({ ...form, max_attendees: e.target.value })}
              placeholder="예: 10 (정원 미설정 시 제한 없음)"
              className="input"
            />
            <p className="text-xs text-gray-400 mt-1">정원이 차면 마감 시간 전이라도 투표가 자동으로 종료돼요</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상세 내용</label>
            <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="input h-28 resize-none" placeholder="거리, 페이스, 준비물 등" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사진 (1MB 이하)</label>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            {imagePreview ? (
              <div className="relative flex justify-center bg-gray-50 rounded-lg overflow-hidden">
                <img src={imagePreview} alt="미리보기" className="max-w-full max-h-[500px] object-contain" />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null) }}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-lg py-8 flex flex-col items-center gap-2 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors">
                <Image size={24} />
                <span className="text-sm">사진 업로드</span>
              </button>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Link href={`/calendar/${eventId}`} className="btn-secondary flex-1 text-center py-3">취소</Link>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 disabled:opacity-50">{loading ? '저장 중...' : '저장'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
