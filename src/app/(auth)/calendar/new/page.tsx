'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, MapPin, Search, X, Image, Check } from 'lucide-react'
import Link from 'next/link'
import { RichTextEditor } from '@/lib/RichTextEditor'

declare global {
  interface Window { Kakao: any }
}

// "YYYY-MM-DD"와 "HH:mm"을 한국 로컬 시간으로 해석해 정확한 UTC ISO 문자열로 변환
// (문자열에 +09:00을 직접 붙이는 방식은 일부 환경에서 무시될 수 있어, Date 객체 생성 방식을 사용)
function localToUtcIso(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [h, min] = timeStr.split(':').map(Number)
  // KST(UTC+9) 기준 로컬 시각을 UTC로 직접 환산: UTC = KST - 9시간
  const utcDate = new Date(Date.UTC(y, m - 1, d, h - 9, min, 0))
  return utcDate.toISOString()
}

const EVENT_TYPES = [
  { value: 'run', label: '정기런' },
  { value: 'ddayrun', label: '뛰꼬양데이' },
  { value: 'event', label: '행사' },
  { value: 'race', label: '대회' },
  { value: 'social', label: '벙개' },
]

interface KakaoPlace {
  id: string; place_name: string; address_name: string
  road_address_name: string; x: string; y: string; place_url: string
}

export default function NewEventPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [showSharePopup, setShowSharePopup] = useState(false)
  const [createdEvent, setCreatedEvent] = useState<{ title: string; id: string; imageUrl?: string | null } | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', location: '', location_url: '',
    event_date: '', event_time: '', event_type: 'run', has_afterparty: false,
    rsvp_deadline_date: '', rsvp_deadline_time: '', max_attendees: '',
  })
  const [locationQuery, setLocationQuery] = useState('')
  const [locationResults, setLocationResults] = useState<KakaoPlace[]>([])
  const [locationSearching, setLocationSearching] = useState(false)
  const [locationSelected, setLocationSelected] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const kakaoInitialized = useRef(false)

  useEffect(() => {
    const initKakao = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init('a0158adb0822ae2bd038e0321530c574')
        kakaoInitialized.current = true
      }
    }
    if (window.Kakao) { initKakao() } else {
      const script = document.createElement('script')
      script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'
      script.async = true
      script.onload = initKakao
      document.head.appendChild(script)
    }
  }, [])

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
      event_date: localToUtcIso(form.event_date, form.event_time),
      event_type: form.event_type, created_by: user?.id, image_url,
      has_afterparty: form.has_afterparty,
      max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
      rsvp_deadline: form.rsvp_deadline_date && form.rsvp_deadline_time
        ? localToUtcIso(form.rsvp_deadline_date, form.rsvp_deadline_time)
        : null,
    }).select('id, title, image_url').single()
    if (!error && inserted) {
      setCreatedEvent({ title: inserted.title, id: inserted.id, imageUrl: inserted.image_url })
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
    if (!window.Kakao) return
    if (!window.Kakao.isInitialized()) window.Kakao.init('a0158adb0822ae2bd038e0321530c574')
    const url = `https://1991-runners.vercel.app/calendar/${createdEvent.id}`
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `🏃 ${createdEvent.title}`,
        description: `${form.location ? form.location + ' · ' : ''}${form.event_date} ${form.event_time}`,
        imageUrl: createdEvent.imageUrl || 'https://kvotmnyktvgqlplfbuqh.supabase.co/storage/v1/object/public/club-images/1991.jpeg',
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [{ title: '모임 보기', link: { mobileWebUrl: url, webUrl: url } }],
    })
    setShowSharePopup(false)
    router.push('/calendar')
    router.refresh()
  }

  const handleSkipShare = () => { router.push('/calendar'); router.refresh() }

  return (
    <>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href={searchParams.get('back') || '/calendar'} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl font-bold text-gray-900">새 모임 만들기</h1>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">모임 종류 *</label>
              <div className="grid grid-cols-5 gap-2">
                {EVENT_TYPES.map(({ value, label }) => (
                  <button key={value} type="button" onClick={() => setForm({ ...form, event_type: value })}
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
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">날짜 *</label>
                <input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="input w-full" required />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">시간 *</label>
                <input type="time" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} className="input w-full" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">장소</label>
              <div className="relative">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={locationQuery} onChange={(e) => { setLocationQuery(e.target.value); setLocationSelected(false) }}
                    className="input pl-9 pr-9" placeholder="장소 검색 (예: 여의도 한강공원)" />
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
              <RichTextEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={5} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">참석 투표 마감 (선택)</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input type="date" value={form.rsvp_deadline_date}
                  onChange={(e) => setForm({ ...form, rsvp_deadline_date: e.target.value })}
                  className="input flex-1" />
                <input type="time" value={form.rsvp_deadline_time}
                  onChange={(e) => setForm({ ...form, rsvp_deadline_time: e.target.value })}
                  className="input flex-1" />
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

            {/* 뒷풀이 토글 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-700">🍺 뒷풀이</p>
                <p className="text-xs text-gray-400 mt-0.5">뒷풀이가 있는 모임인가요?</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, has_afterparty: !form.has_afterparty })}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.has_afterparty ? 'bg-[#c0392b]' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.has_afterparty ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {form.has_afterparty && (
              <p className="text-xs text-[#c0392b] -mt-3 px-1">참석자들이 뒷풀이 참석 여부를 별도로 선택할 수 있어요</p>
            )}

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
              <Link href={searchParams.get('back') || '/calendar'} className="btn-secondary flex-1 text-center py-3">취소</Link>
              <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 disabled:opacity-50">
                {loading ? '등록 중...' : '모임 등록'}
              </button>
            </div>
          </form>
        </div>
      </div>

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
                <button onClick={handleKakaoShare}
                  className="w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
                  style={{ background: '#FEE500', color: '#3C1E1E' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#3C1E1E"><path d="M12 3C6.477 3 2 6.477 2 11c0 2.897 1.698 5.417 4.268 6.933L5.5 21l3.75-2.25C10.007 19.578 11 19.75 12 19.75c5.523 0 10-3.477 10-7.75S17.523 3 12 3z"/></svg>
                  카카오톡으로 공유
                </button>
                <button onClick={handleSkipShare} className="w-full py-3 rounded-xl text-sm text-gray-400 hover:text-gray-600 transition-colors">
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
