'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { MapPin, Clock, Users, User } from 'lucide-react'
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from '@/types'

interface Event {
  id: string
  title: string
  event_date: string
  event_type: string
  location: string
  created_at: string
  attendances: { status: string; user_id: string }[]
  creator: { name: string } | null
}

export default function UpcomingEvents({ events, userId, lastVisited }: {
  events: Event[]
  userId: string
  lastVisited: string | null
}) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const stored = localStorage.getItem('read_event_ids')
    if (stored) setReadIds(new Set(JSON.parse(stored)))
  }, [])

  const isNew = (event: Event) => {
    if (!lastVisited) return false
    if (readIds.has(event.id)) return false
    return new Date(event.created_at) > new Date(lastVisited)
  }

  const handleClick = (eventId: string) => {
    const newReadIds = new Set(readIds)
    newReadIds.add(eventId)
    setReadIds(newReadIds)
    localStorage.setItem('read_event_ids', JSON.stringify([...newReadIds]))
  }

  if (!events || events.length === 0) return (
    <div className="text-center py-12 text-gray-400">
      <p>예정된 모임이 없습니다</p>
    </div>
  )

  return (
    <div className="grid gap-3">
      {events.map(event => {
        const attendingCount = event.attendances?.filter(a => a.status === 'attending').length ?? 0
        const myStatus = event.attendances?.find(a => a.user_id === userId)?.status ?? null
        const newEvent = isNew(event)
        return (
          <Link key={event.id} href={`/calendar/${event.id}`} onClick={() => handleClick(event.id)}>
            <div className="card hover:shadow-md transition-all cursor-pointer border-l-4 border-[#e94560] py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`badge ${EVENT_TYPE_COLORS[event.event_type as keyof typeof EVENT_TYPE_COLORS] || 'bg-gray-100 text-gray-600'}`}>
                      {EVENT_TYPE_LABELS[event.event_type as keyof typeof EVENT_TYPE_LABELS] || event.event_type}
                    </span>
                    {newEvent && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#c0392b] text-white">NEW</span>
                    )}
                    {myStatus === 'attending' && <span className="badge bg-green-100 text-green-700">✓ 참여</span>}
                    {myStatus === 'not_attending' && <span className="badge bg-gray-100 text-gray-500">✗ 불참</span>}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1 text-xs text-gray-500"><Clock size={12} />{format(new Date(event.event_date), 'M월 d일 (E) HH:mm', { locale: ko })}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={12} />{event.location}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500"><Users size={12} />참여 {attendingCount}명</div>
                    {event.creator?.name && (
                      <div className="flex items-center gap-1 text-xs text-gray-500"><User size={12} />호스트 {event.creator.name}</div>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-[#e94560]">{format(new Date(event.event_date), 'd')}</p>
                  <p className="text-xs text-gray-400">{format(new Date(event.event_date), 'M월', { locale: ko })}</p>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
