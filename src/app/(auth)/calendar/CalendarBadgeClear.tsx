'use client'
import { useEffect } from 'react'

export default function CalendarBadgeClear() {
  useEffect(() => {
    localStorage.setItem('calendar_last_visited', new Date().toISOString())
  }, [])
  return null
}
