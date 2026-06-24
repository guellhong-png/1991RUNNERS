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
  console.log('🏃 [정밀 타격 모드 v2] 로드런 사이트 탐색 시작...')
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

    // 현재 날짜 기준 연도
    const currentYear = today.getFullYear()
    
    // 날짜 헤더를 추적하면서 파싱
    let currentMonth = 0
    let currentDay = 0

    // 모든 tr을 순서대로 순회
    $('tr').each((i, el) => {
      const trText = $(el).text().replace(/\s+/g, ' ').trim()
      
      // 날짜 행 감지: "6/5 (금)" 또는 "6/5(금)" 패턴
      const dateHeaderMatch = trText.match(/^(\d{1,2})\/(\d{1,2})\s*\(([가-힣])\)/)
      if (dateHeaderMatch) {
        currentMonth = parseInt(dateHeaderMatch[1])
        currentDay = parseInt(dateHeaderMatch[2])
        return
      }

      // 대회명 링크가 있는 행
      const nameAnchor = $(el).find('a[href*="view.php"]').first()
      if (nameAnchor.length === 0) return
      if (currentMonth === 0) return // 날짜 헤더 없이 나온 대회는 스킵

      const name = nameAnchor.text().trim()
      if (!name || name.length < 2) return

      let rawUrl = nameAnchor.attr('href') || '#'
      // javascript:open_window('win', 'view.php?no=41409', ...) 에서 URL 추출
      const noMatch = rawUrl.match(/view\.php\?no=(\d+)/)
      const url = noMatch
        ? `http://www.roadrun.co.kr/schedule/view.php?no=${noMatch[1]}`
        : `http://www.roadrun.co.kr/schedule/${rawUrl}`

      // 날짜 유효성 검사
      const intYear = currentMonth < today.getMonth() + 1 ? currentYear + 1 : currentYear
      const raceDate = new Date(intYear, currentMonth - 1, currentDay)
      if ((raceDate.getMonth() + 1) !== currentMonth || raceDate.getDate() !== currentDay) return
      if (raceDate < today) return

      const month = String(currentMonth).padStart(2, '0')
      const day = String(currentDay).padStart(2, '0')
      const raceDateStr = `${intYear}-${month}-${day}`

      // td에서 장소, 종목 추출
      const tds = $(el).find('td')
      let location = '전국'
      let distance = '풀코스, 하프, 10km'

      if (tds.length >= 3) {
        // 대회명 td 다음 td들에서 장소와 종목 추출
        const allTdTexts = []
        tds.each((_, td) => {
          const txt = $(td).text().replace(/\s+/g, ' ').trim()
          if (txt && txt !== name) allTdTexts.push(txt)
        })
        
        // 장소 패턴: 지역명 (시/도/군/구)
        for (const txt of allTdTexts) {
          if (txt.match(/[가-힣]{2,}(시|도|군|구|면|동)/)) {
            location = txt.replace(/\s+/g, ' ').trim()
            break
          }
        }
        
        // 종목 패턴: km, 풀, 하프 포함
        for (const txt of allTdTexts) {
          if (txt.match(/(km|풀|하프|마일|K\b)/i)) {
            distance = txt.trim()
            break
          }
        }
      }

      // 풀 → 풀코스 표준화
      if (distance.includes('풀') && !distance.includes('풀코스')) {
        distance = distance.replace(/풀/g, '풀코스')
      }

      // 상태 판단
      const rowText = $(el).text()
      let status = '등록중'
      if (rowText.includes('마감') || rowText.includes('종료')) {
        status = '등록마감'
      } else if (rowText.includes('예정')) {
        status = '등록예정'
      }

      races.push({
        name,
        url,
        distance,
        region: location.slice(0, 2),
        location,
        status,
        race_date: raceDateStr,
        date_label: `${currentMonth}월 ${currentDay}일`,
        day_of_week: ['일', '월', '화', '수', '목', '금', '토'][raceDate.getDay()],
        month_label: `${intYear}년 ${month}월`,
      })
    })

    console.log(`✅ 수집된 대회: 총 ${races.length}개`)
    if (races.length > 0) {
      console.log('샘플 데이터:', JSON.stringify(races[0], null, 2))
    }

    if (races.length > 0) {
      await supabase.from('races').delete().neq('id', 0)
      const { error } = await supabase.from('races').insert(races)
      if (error) throw error
      console.log(`🎉 [대성공] ${races.length}개 대회 저장 완료!`)
    } else {
      console.log('❌ 수집된 데이터가 없습니다.')
    }

  } catch (e) {
    console.error('오류:', e)
    process.exit(1)
  }
}

run()
