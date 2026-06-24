'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Race {
  id: number
  name: string
  url: string
  homepage_url: string | null
  distance: string
  region: string
  location: string
  status: string
  race_date: string
  date_label: string
  day_of_week: string
  month_label: string
  reg_start: string | null
  reg_end: string | null
}

export default function RacesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [distanceFilter, setDistanceFilter] = useState('전체')
  const [statusFilter, setStatusFilter] = useState('전체')
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  useEffect(() => {
    supabase
      .from('races')
      .select('*')
      .order('race_date', { ascending: true })
      .then(({ data }) => {
        setRaces(data ?? [])
        setLoading(false)
      })
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const getDday = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return '오늘!'
    if (diff === 1) return '내일!'
    return 'D-' + diff
  }

  const urgentRaces = races.filter(r => {
    if (!r.reg_end) return false
    const diff = Math.ceil((new Date(r.reg_end).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff >= 0 && diff <= 7
  }).sort((a, b) => new Date(a.reg_end!).getTime() - new Date(b.reg_end!).getTime())

  const filtered = races.filter(r => {
    const distanceOk = distanceFilter === '전체' ||
      (distanceFilter === '풀코스' && r.distance.includes('풀코스')) ||
      (distanceFilter === '하프' && r.distance.includes('하프')) ||
      (distanceFilter === '10km' && r.distance.includes('10km')) ||
      (distanceFilter === '트레일' && (r.distance.toLowerCase().includes('k') || r.name.includes('트레일')))
    const statusOk = statusFilter === '전체' || r.status === statusFilter
    const searchOk = searchQuery === '' ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.region.toLowerCase().includes(searchQuery.toLowerCase())
    return distanceOk && statusOk && searchOk
  })

  const grouped = filtered.reduce((acc, race) => {
    if (!acc[race.month_label]) acc[race.month_label] = []
    acc[race.month_label].push(race)
    return acc
  }, {} as Record<string, Race[]>)

  const statusColor = (status: string) => {
    if (status === '등록중') return { bg: '#e8f5e9', color: '#2e7d32' }
    if (status === '등록예정') return { bg: '#e3f2fd', color: '#1565c0' }
    return { bg: '#ffebee', color: '#b71c1c' }
  }

  const handleCalendarRegister = (race: Race) => {
    const params = new URLSearchParams({
      title: race.name,
      location: race.location || '',
      date: race.race_date,
      event_type: 'race',
      description: race.homepage_url ? '공식 홈페이지: ' + race.homepage_url : '',
    })
    router.push('/calendar/new?' + params.toString())
  }

  const calYear = calMonth.getFullYear()
  const calMonthNum = calMonth.getMonth()
  const firstDay = new Date(calYear, calMonthNum, 1).getDay()
  const daysInMonth = new Date(calYear, calMonthNum + 1, 0).getDate()

  const getCalEvents = (day: number) => {
    const dateStr = calYear + '-' + String(calMonthNum + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0')
    const events: { name: string; type: 'reg_start' | 'reg_end' | 'race' }[] = []
    races.forEach(r => {
      if (r.reg_start === dateStr) events.push({ name: r.name, type: 'reg_start' })
      if (r.reg_end === dateStr) events.push({ name: r.name, type: 'reg_end' })
      if (r.race_date === dateStr) events.push({ name: r.name, type: 'race' })
    })
    return events
  }

  const calEventStyle = (type: string) => {
    if (type === 'reg_start') return 'bg-green-100 text-green-800'
    if (type === 'reg_end') return 'bg-red-100 text-red-800'
    return 'bg-blue-100 text-blue-800'
  }

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대회 일정</h1>
        <p className="text-gray-500 mt-1">{'마라톤/트레일런 대회 정보 · ' + races.length + '개 대회'}</p>
      </div>

      {/* 검색 + 필터 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="🔍 대회명, 지역 검색..."
          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#c0392b] text-gray-700 w-48"
        />
        <div className="flex gap-2 items-center ml-auto">
          <select value={distanceFilter} onChange={e => setDistanceFilter(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#c0392b] text-gray-700">
            <option value="전체">전체 거리</option>
            <option value="풀코스">풀코스</option>
            <option value="하프">하프</option>
            <option value="10km">10km</option>
            <option value="트레일">트레일</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#c0392b] text-gray-700">
            <option value="전체">전체 상태</option>
            <option value="등록중">등록중</option>
            <option value="등록예정">등록예정</option>
            <option value="등록마감">등록마감</option>
          </select>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setView('list')} className={'px-3 py-1.5 text-xs transition-colors ' + (view === 'list' ? 'bg-[#c0392b] text-white' : 'text-gray-500 hover:bg-gray-50')}>
              📋 목록
            </button>
            <button onClick={() => setView('calendar')} className={'px-3 py-1.5 text-xs transition-colors ' + (view === 'calendar' ? 'bg-[#c0392b] text-white' : 'text-gray-500 hover:bg-gray-50')}>
              📅 캘린더
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">대회 일정 불러오는 중...</p>
        </div>
      ) : view === 'list' ? (
        <div className="space-y-5">
          {urgentRaces.length > 0 && !searchQuery && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-2">
                ⏰ 접수 마감 임박
                <span className="text-xs font-normal text-orange-500">7일 이내 마감 대회</span>
              </p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {urgentRaces.map((race, i) => (
                  <div key={i} className="bg-white border border-orange-100 rounded-lg p-3 min-w-[160px] shrink-0">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 inline-block mb-2">{getDday(race.reg_end!)}</span>
                    <p className="text-xs font-medium text-gray-900 mb-1 line-clamp-2">{race.name}</p>
                    <p className="text-xs text-gray-400">{race.race_date}</p>
                    <p className="text-xs text-red-500 mt-1">{'마감 ' + race.reg_end}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(grouped).length === 0 ? (
            <div className="card text-center py-16">
              <p className="text-4xl mb-3">🏃</p>
              <p className="text-gray-400">{searchQuery ? '"' + searchQuery + '" 검색 결과가 없습니다' : '해당하는 대회가 없습니다'}</p>
              {searchQuery && <button onClick={() => setSearchQuery('')} className="mt-3 text-xs text-[#c0392b] underline">검색 초기화</button>}
            </div>
          ) : (
            Object.entries(grouped).map(([month, monthRaces]) => (
              <div key={month}>
                <div className="bg-gray-100 rounded-lg px-3 py-1.5 mb-2 inline-block">
                  <span className="text-xs font-semibold text-[#c0392b]">{month}</span>
                </div>
                <div className="space-y-2">
                  {monthRaces.map((race, i) => {
                    const sc = statusColor(race.status)
                    const isExpired = race.status === '등록마감'
                    const dday = getDday(race.race_date)
                    return (
                      <div key={i} className={'card py-3 px-4 ' + (isExpired ? 'opacity-60' : '')}>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: sc.bg, color: sc.color }}>{race.status}</span>
                              {race.distance && race.distance !== '정보 없음' && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{race.distance}</span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900 truncate mb-1">{race.name}</p>
                            <p className="text-xs text-gray-500">
                              {race.date_label + ' (' + race.day_of_week + ')'}
                              {race.reg_end && <span className="ml-2 text-red-400">{'마감 ' + race.reg_end}</span>}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {!isExpired && <span className="text-sm font-bold text-[#c0392b]">{dday}</span>}
                            <div className="flex gap-1.5">
                              <a href={race.homepage_url || race.url} target="_blank" rel="noopener noreferrer" className="text-xs py-1.5 px-3 rounded-lg text-center text-white font-medium whitespace-nowrap" style={{ background: '#c0392b' }}>접수하기</a>
                              <button onClick={() => handleCalendarRegister(race)} disabled={isExpired} className="text-xs py-1.5 px-3 rounded-lg text-center font-medium border whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed" style={{ color: isExpired ? '#999' : '#c0392b', borderColor: isExpired ? '#ddd' : '#c0392b' }}>캘린더 등록</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCalMonth(new Date(calYear, calMonthNum - 1, 1))} className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">← 이전</button>
            <span className="font-semibold text-gray-900">{calYear + '년 ' + (calMonthNum + 1) + '월'}</span>
            <button onClick={() => setCalMonth(new Date(calYear, calMonthNum + 1, 1))} className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">다음 →</button>
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden text-xs">
            {['일','월','화','수','목','금','토'].map(d => (
              <div key={d} className="bg-gray-50 text-center py-2 font-medium text-gray-500">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={'e'+i} className="bg-gray-50 min-h-[70px]" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const isToday = calYear === today.getFullYear() && calMonthNum === today.getMonth() && day === today.getDate()
              const events = getCalEvents(day)
              return (
                <div key={day} className={'bg-white min-h-[70px] p-1 ' + (isToday ? 'bg-red-50' : '')}>
                  <p className={'text-xs mb-1 ' + (isToday ? 'text-[#c0392b] font-bold' : 'text-gray-400')}>{day}</p>
                  {events.slice(0, 3).map((ev, j) => (
                    <div key={j} className={'text-[9px] px-1 py-0.5 rounded mb-0.5 truncate ' + calEventStyle(ev.type)}>{ev.name}</div>
                  ))}
                  {events.length > 3 && <p className="text-[9px] text-gray-400">+{events.length - 3}</p>}
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 mt-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-gray-500"><div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>접수 시작</div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500"><div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>접수 마감</div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500"><div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>대회 개최일</div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">데이터 출처: roadrun.co.kr</p>
    </div>
  )
}
