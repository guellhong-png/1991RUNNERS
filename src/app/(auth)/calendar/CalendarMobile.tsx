'use client'
import { useState } from 'react'
import { format, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  event_date: string
  event_type: string
}

const typeColors: Record<string, string> = {
  run: 'bg-blue-500',
  ddayrun: 'bg-purple-500',
  event: 'bg-green-500',
  race: 'bg-red-500',
  social: 'bg-yellow-500',
}

const typeBadgeColors: Record<string, string> = {
  run: 'bg-blue-100 text-blue-700',
  ddayrun: 'bg-purple-100 text-purple-700',
  event: 'bg-green-100 text-green-700',
  race: 'bg-red-100 text-red-700',
  social: 'bg-yellow-100 text-yellow-700',
}

const TYPE_LABELS: Record<string, string> = {
  run: '정기런', ddayrun: '뛰꼬양데이', event: '행사', race: '대회', social: '벙개',
}

export default function CalendarMobile({ events, year, month, days, firstDayOfWeek, totalCells }: {
  events: Event[]
  year: number
  month: number
  days: string[]
  firstDayOfWeek: number
  totalCells: number
}) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const getEventsForDay = (dayIdx: number) => {
    const day = days[dayIdx]
    if (!day) return []
    const dateStr = day.split('T')[0]
    // UTC로 저장된 event_date를 KST(+9)로 변환해서 날짜 비교
    return events.filter(e => {
      const kstDate = new Date(new Date(e.event_date).getTime() + 9 * 60 * 60 * 1000)
      const kstDateStr = kstDate.toISOString().split('T')[0]
      return kstDateStr === dateStr
    })
  }

  const selectedEvents = selectedDay !== null ? getEventsForDay(selectedDay) : []
  const selectedDate = selectedDay !== null ? new Date(days[selectedDay]) : null

  return (
    <>
      <p className="text-xs text-gray-400 text-center py-2">날짜를 클릭하면 모임을 볼 수 있어요</p>
      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={'e' + i} className="min-h-[52px]" />
        ))}
        {days.map((dayStr, dayIdx) => {
          const day = new Date(dayStr)
          const dayOfWeek = (firstDayOfWeek + dayIdx) % 7
          const todayCheck = isToday(day)
          const isSelected = selectedDay === dayIdx
          const dayEvents = getEventsForDay(dayIdx)
          const dotTypes = [...new Set(dayEvents.map(e => e.event_type))]

          return (
            <div
              key={dayIdx}
              onClick={() => setSelectedDay(isSelected ? null : dayIdx)}
              className={`min-h-[52px] flex flex-col items-center pt-1.5 pb-1 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-medium ${
                todayCheck ? 'bg-[#e94560] text-white' :
                isSelected ? 'text-[#e94560] font-bold' :
                dayOfWeek === 0 ? 'text-red-400' :
                dayOfWeek === 6 ? 'text-blue-400' : 'text-gray-700'
              }`}>
                {format(day, 'd')}
              </span>
              <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                {dotTypes.slice(0, 3).map((type, j) => (
                  <div key={j} className={`w-1.5 h-1.5 rounded-full ${typeColors[type] || 'bg-gray-400'}`} />
                ))}
                {dotTypes.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
              </div>
            </div>
          )
        })}
      </div>

      {/* 선택된 날짜 목록 */}
      {selectedDay !== null && selectedDate && (
        <div className="mt-3 border-t border-gray-100 pt-3 px-3 pb-3">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            {format(selectedDate, 'M월 d일 (E)', { locale: ko })} · {selectedEvents.length}개
          </p>
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">이 날은 모임이 없어요</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map(ev => (
                <Link key={ev.id} href={`/calendar/${ev.id}`}>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${typeBadgeColors[ev.event_type] || 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[ev.event_type] || ev.event_type}
                    </span>
                    <p className="text-xs font-medium text-gray-900 flex-1 truncate">{ev.title}</p>
                    <span className="text-xs text-gray-400 shrink-0">
                      {(() => { const kst = new Date(new Date(ev.event_date).getTime() + 9 * 60 * 60 * 1000); return `${String(kst.getUTCHours()).padStart(2,'0')}:${String(kst.getUTCMinutes()).padStart(2,'0')}` })()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
