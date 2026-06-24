import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('환경변수가 세팅되지 않았습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('🏃 [v3] 로드런 사이트 탐색 시작...')
  try {
    const res = await fetch('http://www.roadrun.co.kr/schedule/list.php', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    })

    const buffer = await res.arrayBuffer()
    const decoder = new TextDecoder('euc-kr')
    const html = decoder.decode(buffer)
    const $ = cheerio.load(html)
    const races = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const currentYear = today.getFullYear()

    // HTML 원문에서 날짜+대회 블록을 직접 정규식으로 파싱
    // 패턴: <b>6/5</b> 또는 6/5 형태 날짜 + view.php 링크
    const lines = html.split('\n')
    let currentMonth = 0
    let currentDay = 0

    for (const line of lines) {
      // 날짜 패턴 감지: >6/5< 또는 >6/5(금)< 형태
      const dateMatch = line.match(/>(\d{1,2})\/(\d{1,2})\s*(?:\([가-힣]\))?</)
      if (dateMatch) {
        const m = parseInt(dateMatch[1])
        const d = parseInt(dateMatch[2])
        if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
          currentMonth = m
          currentDay = d
        }
        continue
      }

      // 대회 링크 감지
      if (line.includes('view.php') && currentMonth > 0) {
        const noMatch = line.match(/view\.php\?no=(\d+)/)
        if (!noMatch) continue

        const nameMatch = line.match(/view\.php[^>]+>([^<]+)</)
        if (!nameMatch) continue

        const name = nameMatch[1].trim()
        if (!name || name.length < 2) continue

        const no = noMatch[1]
        const url = `http://www.roadrun.co.kr/schedule/view.php?no=${no}`

        // 날짜 유효성
        let intYear = currentYear
        if (currentMonth < today.getMonth() + 1) intYear = currentYear + 1

        const raceDate = new Date(intYear, currentMonth - 1, currentDay)
        if ((raceDate.getMonth() + 1) !== currentMonth || raceDate.getDate() !== currentDay) continue
        if (raceDate < today) continue

        const month = String(currentMonth).padStart(2, '0')
        const day = String(currentDay).padStart(2, '0')

        // 같은 행에서 종목 추출 (km 패턴)
        const distanceMatch = line.match(/([풀하프\d,\s]+(?:km|K|마일)[^\s<]*)/)
        let distance = distanceMatch ? distanceMatch[1].trim() : ''
        if (distance.includes('풀') && !distance.includes('풀코스')) {
          distance = distance.replace(/풀/g, '풀코스')
        }

        // 상태
        let status = '등록중'
        if (line.includes('마감') || line.includes('종료')) status = '등록마감'
        else if (line.includes('예정')) status = '등록예정'

        console.log(`✅ ${name} / ${intYear}-${month}-${day}`)

        races.push({
          name,
          url,
          distance: distance || '정보 없음',
          region: '',
          location: '',
          status,
          race_date: `${intYear}-${month}-${day}`,
          date_label: `${currentMonth}월 ${currentDay}일`,
          day_of_week: ['일', '월', '화', '수', '목', '금', '토'][raceDate.getDay()],
          month_label: `${intYear}년 ${month}월`,
        })
      }
    }

    console.log(`\n✅ 수집된 대회: 총 ${races.length}개`)

    if (races.length > 0) {
      await supabase.from('races').delete().neq('id', 0)
      const { error } = await supabase.from('races').insert(races)
      if (error) throw error
      console.log(`🎉 [대성공] ${races.length}개 저장 완료!`)
    } else {
      console.log('❌ 수집된 데이터가 없습니다.')
    }

  } catch (e) {
    console.error('오류:', e)
    process.exit(1)
  }
}

run()
