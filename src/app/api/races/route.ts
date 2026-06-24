import { NextResponse } from 'next/server'
// 프로젝트 구조에 따라 supabaseClient 임포트 경로가 다를 수 있습니다. 
// 보통 @/lib/supabase 나 @/utils/supabase 등을 확인해주세요.
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Supabase 클라이언트 초기화 (환경변수 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET() {
  try {
    // Supabase 'races' 테이블에서 날짜 오름차순으로 데이터 가져오기
    const { data: races, error } = await supabase
      .from('races')
      .select('*')
      .order('race_date', { ascending: true })

    if (error) throw error

    // 프론트엔드가 요구하는 데이터 규격(camelCase 등)에 맞게 변환
    const formattedRaces = (races || []).map(race => ({
      name: race.name,
      url: race.url,
      distance: race.distance,
      region: race.region,
      location: race.location,
      status: race.status,
      date: race.race_date,
      dateLabel: race.date_label,
      dayOfWeek: race.day_of_week,
      month: race.month_label,
    }))

    return NextResponse.json({ races: formattedRaces })
  } catch (error: any) {
    console.error('Supabase fetch error:', error)
    return NextResponse.json({ error: error.message, races: [] }, { status: 500 })
  }
}
