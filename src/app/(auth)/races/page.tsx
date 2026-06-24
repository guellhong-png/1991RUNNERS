'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Race {
  name: string
  url: string
  distance: string
  region: string
  location: string
  status: string
  date: string
  dateLabel: string
  dayOfWeek: string
  month: string
}

export default function RacesPage() {
  const router = useRouter()
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [distanceFilter, setDistanceFilter] = useState('전체')
  const [statusFilter, setStatusFilter] = useState('전체')

  useEffect(() => {
    fetch('/api/races')
      .then(res => res.json())
      .then(data => { setRaces(data.races ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = races.filter(r => {
    const distanceOk = distanceFilter === '전체' ||
      (distanceFilter === '풀코스' && r.distance.includes('풀')) ||
      (distanceFilter === '하프' && r.distance.includes('하프')) ||
      (distanceFilter === '10km' && r.distance.includes('10km')) ||
      (distanceFilter === '트레일' && r.distance.includes('K'))
    const statusOk = statusFilter === '전체' || r.status === statusFilter
    return distanceOk && statusOk
  })

  const grouped = filtered.reduce((acc, race) => {
    if (!acc[race.month]) acc[race.month] = []
    acc[race.month].push(race)
    return acc
  }, {} as Record<string, Race[]>)

  const handleCalendarRegister = (race: Race) => {
    const params = new URLSearchParams({
      title: race.name,
      location: race.region + ' · ' + race.location,
      date: race.date,
    })
    router.push('/calendar/new?' + params.toString())
  }

  const statusColor = (status: string) => {
    if (status === '등록중') return { bg: '#e8f5e9', color: '#2e7d32' }
    if (status === '등록예정') return { bg: '#e3f2fd', color: '#1565c0' }
    return { bg: '#ffebee', color: '#b71c1c' }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대회 일정</h1>
          <p className="text-gray-500 mt-1">마라톤/트레일런 대회 정보</p>
        </div>
        <div className="flex gap-2">
          <select
            value={distanceFilter}
            onChange={e => setDistanceFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#c0392b] text-gray-700"
          >
            <option value="전체">전체 거리</option>
            <option value="풀코스">풀코스</option>
            <option value="하프">하프</option>
            <option value="10km">10km</option>
            <option value="트레일">트레일</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#c0392b] text-gray-700"
          >
            <option value="전체">전체 상태</option>
            <option value="등록중">등록중</option>
            <option value="등록예정">등록예정</option>
            <option value="등록마감">등록마감</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">대회 일정 불러오는 중...</p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🏃</p>
          <p className="text-gray-400">해당하는 대회가 없습니다</p>
        </div>
      ) : (
        Object.entries(grouped).map(([month, monthRaces]) => (
          <div key={month}>
            <div className="bg-gray-100 rounded-lg px-4 py-2 mb-3">
              <span className="text-sm font-semibold text-[#c0392b]">{month}</span>
            </div>
            <div className="space-y-3">
              {monthRaces.map((race, i) => {
                const sc = statusColor(race.status)
                const isExpired = race.status === '등록마감'
                return (
                  <div key={i} className={`card ${isExpired ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: sc.bg, color: sc.color }}
                          >
                            {race.status}
                          </span>
                          {race.distance && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                              {race.distance}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-gray-900 mb-1">{race.name}</p>
                        <p className="text-sm text-gray-500">
                          {race.dateLabel} ({race.dayOfWeek}) &nbsp;|&nbsp; {race.region} · {race.location}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0 w-20">
                        <a
                          href={race.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs py-1.5 rounded-lg text-center text-white font-medium block"
                          style={{ background: '#c0392b' }}
                        >
                          보러가기
                        </a>
                        <button
                          onClick={() => handleCalendarRegister(race)}
                          disabled={isExpired}
                          className="text-xs py-1.5 rounded-lg text-center font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ color: isExpired ? '#999' : '#c0392b', borderColor: isExpired ? '#ddd' : '#c0392b' }}
                        >
                          캘린더 등록
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
      <p className="text-xs text-gray-400 text-center">데이터 출처: 고러닝(gorunning.kr)</p>
    </div>
  )
}
