export type Role = 'pending' | 'member' | 'admin'
export type EventType = 'run' | 'race' | 'social' | 'training' | 'other'
export type AttendanceStatus = 'attending' | 'not_attending'
export type FinanceType = 'income' | 'expense'

export interface Profile {
  id: string; email: string; name: string; phone?: string
  role: Role; joined_at?: string; created_at: string; updated_at: string
}
export interface Event {
  id: string; title: string; description?: string; location: string
  event_date: string; event_type: EventType; created_by?: string
  created_at: string; updated_at: string
  creator?: Pick<Profile, 'id' | 'name'>
  attendances?: Attendance[]
}
export interface Attendance {
  id: string; event_id: string; user_id: string; status: AttendanceStatus
  created_at: string; updated_at: string
  profile?: Pick<Profile, 'id' | 'name'>
}
export interface Post {
  id: string; title: string; content: string; is_pinned: boolean
  author_id?: string; created_at: string; updated_at: string
  author?: Pick<Profile, 'id' | 'name'>
}
export interface Finance {
  id: string; type: FinanceType; amount: number; description: string
  category?: string; transaction_date: string; balance_after?: number
  created_by?: string; created_at: string
  creator?: Pick<Profile, 'id' | 'name'>
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  run: '정기런', race: '대회', social: '번개/소셜', training: '훈련', other: '기타',
}
export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  run: 'bg-blue-100 text-blue-800', race: 'bg-red-100 text-red-800',
  social: 'bg-yellow-100 text-yellow-800', training: 'bg-green-100 text-green-800',
  other: 'bg-gray-100 text-gray-800',
}
export const FINANCE_CATEGORIES = ['회비', '대회참가비', '회식', '장비', '적립금', '기타']
