'use client'
import Link from 'next/link'
import { Calendar } from 'lucide-react'

interface Event {
  id: string
  title: string
  event_date: string
  rsvp_deadline: string
  creator: { name: string }[] | null
}

export default function RsvpDeadlineSlider({ events }: { events: Event[] }) {
  const now = new Date()

  const urgentEvents = events.filter(e => {
    if (!e.rsvp_deadline) return false
    const deadline = new Date(e.rsvp_deadline)
    const diffMs = deadline.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    return diffMs > 0 && diffHours <= 48
  }).sort((a, b) => new Date(a.rsvp_deadline).getTime() - new Date(b.rsvp_deadline).getTime())

  if (urgentEvents.length === 0) return null

  const getDdayLabel = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr)
    const diffMs = deadline.getTime() - now.getTime()
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
    if (diffHours <= 1) return '1시간 이내!'
    if (diffHours <= 24) return `${diffHours}시간 후 마감`
    return `D-${Math.ceil(diffHours / 24)}`
  }

  const formatDeadline = (deadlineStr: string) => {
    const kst = new Date(new Date(deadlineStr).getTime() + 9 * 60 * 60 * 1000)
    const m = kst.getUTCMonth() + 1
    const day = kst.getUTCDate()
    const h = String(kst.getUTCHours()).padStart(2, '0')
    const min = String(kst.getUTCMinutes()).padStart(2, '0')
    return `${m}월 ${day}일 ${h}:${min}까지`
  }

  const formatEventDate = (dateStr: string) => {
    const kst = new Date(new Date(dateStr).getTime() + 9 * 60 * 60 * 1000)
    return `${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일`
  }

  const isUrgent = (deadlineStr: string) => {
    return new Date(deadlineStr).getTime() - now.getTime() <= 1000 * 60 * 60 * 24
  }

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
      <p className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-2">
        ⏰ 참석 투표 마감 임박!
        <span className="text-xs font-normal text-orange-500">48시간 이내 마감</span>
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {urgentEvents.map((event) => (
          <Link key={event.id} href={`/calendar/${event.id}`}>
            <div className={`bg-white rounded-lg p-3 min-w-[160px] max-w-[190px] shrink-0 hover:shadow-sm transition-shadow cursor-pointer border ${isUrgent(event.rsvp_deadline) ? 'border-red-100' : 'border-orange-100'}`}>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-2 ${
                isUrgent(event.rsvp_deadline)
                  ? 'bg-red-100 text-red-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {getDdayLabel(event.rsvp_deadline)}
              </span>
              <p className="text-xs font-semibold text-gray-900 mb-2 line-clamp-2 leading-snug">{event.title}</p>
              <div className="flex items-center gap-1 text-gray-400 text-xs mb-1.5">
                <Calendar size={11} />
                <span>{formatEventDate(event.event_date)}</span>
              </div>
              <p className="text-xs text-orange-500 font-medium">{formatDeadline(event.rsvp_deadline)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
