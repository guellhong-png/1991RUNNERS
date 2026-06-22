export type Role = 'pending' | 'member' | 'admin'
export type EventType = 'run' | 'ddayrun' | 'event' | 'race' | 'social'
export type AttendanceStatus = 'attending' | 'not_attending'
export type FinanceType = 'income' | 'expense'
export type PostCategory = 'news' | 'notice' | 'free'

export interface Profile {
  id: string; email: string; name: string; phone?: string
  role: Role; grade?: string; joined_at?: string
  birthday?: string; pb_full?: string; pb_10k?: string
  instagram?: string; bio?: string
  created_at: string; updated_at: string
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
  category: PostCategory; author_id?: string; created_at: string; updated_at: string
  author?: Pick<Profile, 'id' | 'name'>
}
export interface Finance {
  id: string; type: FinanceType; amount: number; description: string
  category?: string; transaction_date: string; balance_after?: number
  created_by?: string; created_at: string
  creator?: Pick<Profile, 'id' | 'name'>
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  run: '정기런', ddayrun: '뛰꼬양데이', event: '행사', race: '대회', social: '번개',
}
export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  run: 'bg-blue-100 text-blue-800', ddayrun: 'bg-purple-100 text-purple-800',
  event: 'bg-green-100 text-green-800', race: 'bg-red-100 text-red-800',
  social: 'bg-yellow-100 text-yellow-800',
}
export const FINANCE_CATEGORIES = ['회비', '대회참가비', '회식', '장비', '적립금', '기타']

export const NOTICE_ITEMS = [
  '뛰꼬양 정회원 조건',
  '뛰꼬양 정기런 참여방법',
  '뛰꼬양 번개 개최방법',
  '뛰꼬양 마킹 방법',
  '가민 그룹 가입방법',
  'FAQ',
  '호스트 가이드',
]
