'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function CalendarNav({ year, month }: { year: number; month: number }) {
  const router = useRouter()
  const current = new Date(year, month - 1, 1)

  const prev = subMonths(current, 1)
  const next = addMonths(current, 1)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
      <button
        onClick={() => router.push(`/calendar?year=${prev.getFullYear()}&month=${prev.getMonth() + 1}`)}
        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ChevronLeft size={18} className="text-gray-600" />
      </button>
      <h2 className="text-base font-bold text-gray-900">
        {format(current, 'yyyy년 M월', { locale: ko })}
      </h2>
      <button
        onClick={() => router.push(`/calendar?year=${next.getFullYear()}&month=${next.getMonth() + 1}`)}
        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ChevronRight size={18} className="text-gray-600" />
      </button>
    </div>
  )
}
