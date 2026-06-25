'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, MapPin, Search, X, Image, Check } from 'lucide-react'
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
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [showSharePopup, setShowSharePopup] = useState(false)
  const [createdEvent, setCreatedEvent] = useState<{ title: string; id: string } | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', location: '', location_url: '',
    event_date: '', event_time: '', event_type: 'run',
  })
  const [locationQuery, setLocationQuery] = useState('')
  const [locationResults, setLocationResults] = useState<KakaoPlace[]>([])
  const [locationSearching, setLocationSearching] = useState(false)
  const [locationSelected, setLocationSelected] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const title = searchParams.get('title') || ''
    const location = searchParams.get('location') || ''
    const date = searchParams.get('date') || ''
    const event_type = searchParams.get('event_type') || 'run'
    const description = searchParams.get('description') || ''
    if (title || date) {
      setForm(prev => ({ ...prev, title, location, event_date: date, event_type, description }))
      if (location) { setLocationQuery(location); setLocationSelected(true) }
    }
  }, [])

  const searchLocation = async (query: string) => {
    if (!query.trim()) { setLocationResults([]); return }
    setLocationSearching(true)
    try {
      const res = await fetch(`/api/kakao-search?query=${encodeURIComponent(query)}`)
      const data = await res.json()
      setLocationResults(data.documents ?? [])
    } catch { setLocationResults([]) }
    setLocationSearching(false)
  }

  useEffect(() => {
    if (locationSelected) return
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => searchLocation(locationQuery), 400)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
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
    if (file.size > 1024 * 1024) { alert('이미지는 1MB 이하로 업로드해주세요.'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    let image_url = null
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('event-images').upload(path, imageFile)
      if (!uploadError) {
        const { data } = supabase.storage.from('event-images').getPublicUrl(path)
        image_url = data.publicUrl
      }
    }

    const { data: inserted, error } = await supabase.from('events').insert({
      title: form.title, description: form.description,
      location: form.location, location_url: form.location_url,
      event_date: `${form.event_date}T${form.event_time}:00`,
      event_type: form.event_type, created_by: user?.id,
      image_url,
    }).select('id, title').single()

    if (!error && inserted) {
      setCreatedEvent({ title: inserted.title, id: inserted.id })
      if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
        setShowSharePopup(true)
      } else {
        router.push('/calendar')
        router.refresh()
      }
    }
    setLoading(false)
  }

  const handleKakaoShare = () => {
    if (!createdEvent) return
    const url = `https://1991-runners.vercel.app/calendar/${createdEvent.id}`
    const text = `[1991RUNNERS] ${createdEvent.title}\n${form.location ? form.location + ' · ' : ''}${form.event_date} ${form.event_time}\n\n모임 보러가기: ${url}`

    const kakaoScheme = `kakaolink://send?text=${encodeURIComponent(text)}`
    window.location.href = kakaoScheme

    setTimeout(() => {
      if (navigator.share) {
        navigator.share({ title: `[1991RUNNERS] ${createdEvent.title}`, text, url })
      }
    }, 2000)
  }

  const handleSkipShare = () => {
    router.push('/calendar')
    router.refresh()
  }

  return (
    <>
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
                    onClick={() => setForm({ ...form, event_type: value })}
                    className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors ${form.event_type === value ? 'bg-[#c0392b] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">모임 제목 *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="예: 한강 정기런" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">날짜 *</label>
                <input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시간 *</label>
                <input type="time" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} className="input" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">장소</label>
              <div className="relative">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={locationQuery}
                    onChange={(e) => { setLocationQuery(e.target.value); setLocationSelected(false) }}
                    className="input pl-9 pr-9"
                    placeholder="장소 검색 (예: 여의도 한강공원)"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">상세 내용</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input h-28 resize-none" placeholder="거리, 페이스, 준비물 등" />
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
              <Link href="/calendar" className="btn-secondary flex-1 text-center py-3">취소</Link>
              <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 disabled:opacity-50">{loading ? '등록 중...' : '모임 등록'}</button>
            </div>
          </form>
        </div>
      </div>

      {/* 공유 팝업 (모바일 전용) */}
      {showSharePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Check size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">모임 등록 완료!</p>
                  <p className="text-sm text-gray-500 truncate">{createdEvent?.title}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <p className="text-sm text-gray-500 mb-1">멤버들에게 알릴까요?</p>
                <p className="text-sm font-medium text-gray-800">카카오톡으로 공유하기</p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleKakaoShare}
                  className="w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
                  style={{ background: '#FEE500', color: '#3C1E1E' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.48 3 2 6.72 2 11.28c0 2.88 1.68 5.4 4.2 6.96l-.96 3.6 4.08-2.16c.84.12 1.74.24 2.64.24 5.52 0 10-3.72 10-8.28C22 6.72 17.52 3 12 3z"/></svg>
                  카카오톡으로 공유
                </button>
                <button
                  onClick={handleSkipShare}
                  className="w-full py-3 rounded-xl text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  나중에 공유할게요
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
