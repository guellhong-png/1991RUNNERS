import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('환경변수가 세팅되지 않았습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fetchEucKr(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  })
  const buffer = await res.arrayBuffer()
  const decoder = new TextDecoder('euc-kr')
  return decoder.decode(buffer)
}

function isValidDate(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d instanceof Date && !isNaN(d) && d.toISOString().startsWith(dateStr)
}

async function getDetailInfo(no) {
  try {
    const html = await fetchEucKr(`http://www.roadrun.co.kr/schedule/view.php?no=${no}`)
    const $ = cheerio.load(html)
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim()

    let regStart = null
    let regEnd = null
    let homepageUrl = null

    const pattern1 = bodyText.match(/접수기간\s*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*~\s*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/)
    if (pattern1) {
      regStart = `${pattern1[1]}-${String(pattern1[2]).padStart(2,'0')}-${String(pattern1[3]).padStart(2,'0')}`
      regEnd = `${pattern1[4]}-${String(pattern1[5]).padStart(2,'0')}-${String(pattern1[6]).padStart(2,'0')}`
    }

    if (!regStart) {
      const pattern2 = bodyText.match(/접수기간\s*(\d{4})[.\-](\d{2})[.\-](\d{2})\s*~\s*(\d{4})[.\-](\d{2})[.\-](\d{2})/)
      if (pattern2) {
        regStart = `${pattern2[1]}-${pattern2[2]}-${pattern2[3]}`
        regEnd = `${pattern2[4]}-${pattern2[5]}-${pattern2[6]}`
      }
    }

    if (!regStart) {
      const pattern3 = bodyText.match(/접수기간\s*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*~\s*(\d{1,2})월\s*(\d{1,2})일/)
      if (pattern3) {
        regStart = `${pattern3[1]}-${String(pattern3[2]).padStart(2,'0')}-${String(pattern3[3]).padStart(2,'0')}`
        regEnd = `${pattern3[1]}-${String(pattern3[4]).padStart(2,'0')}-${String(pattern3[5]).padStart(2,'0')}`
      }
    }

    if (!isValidDate(regStart)) regStart = null
    if (!isValidDate(regEnd)) regEnd = null

    // 홈페이지 URL
    $('a').each((_, el) => {
      const href = $(el).attr('href') || ''
      if (href.startsWith('http') && !href.includes('roadrun.co.kr') && !href.includes('mailto') && !homepageUrl) {
        homepageUrl = href
      }
    })

    // 상태: reg_end 기준으로 자동 계산
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let status = '등록중'
    if (regEnd) {
      const endDate = new Date(regEnd)
      if (endDate < today) status = '등록마감'
      else if (regStart && new Date(regStart) > today) status = '등록예정'
    } else if (regStart && new Date(regStart) > today) {
      status = '등록예정'
    }

    return { regStart, regEnd, homepageUrl, status }
  } catch (e) {
    return { regStart: null, regEnd: null, homepageUrl: null, status: '등록중' }
  }
}

async function run() {
  console.log('🏃 [v8] 로드런 사이트 탐색 시작...')
  try {
    const html = await fetchEucKr('http://www.roadrun.co.kr/schedule/list.php')
    const lines = html.split('\n')
    const races = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const currentYear = today.getFullYear()
    let currentMonth = 0
    let currentDay = 0

    for (const line of lines) {
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

      if (line.includes('view.php') && currentMonth > 0) {
        const noMatch = line.match(/view\.php\?no=(\d+)/)
        if (!noMatch) continue
        const nameMatch = line.match(/view\.php[^>]+>([^<]+)</)
        if (!nameMatch) continue
        const name = nameMatch[1].trim()
        if (!name || name.length < 2) continue
        const no = noMatch[1]

        let intYear = currentYear
        if (currentMonth < today.getMonth() + 1) intYear = currentYear + 1

        const raceDate = new Date(intYear, currentMonth - 1, currentDay)
        if ((raceDate.getMonth() + 1) !== currentMonth || raceDate.getDate() !== currentDay) continue
        if (raceDate < today) continue

        const month = String(currentMonth).padStart(2, '0')
        const day = String(currentDay).padStart(2, '0')

        const distanceMatch = line.match(/([풀하프\d,\s]+(?:km|K|마일)[^\s<]*)/)
        let distance = distanceMatch ? distanceMatch[1].trim() : ''
        if (distance.includes('풀') && !distance.includes('풀코스')) {
          distance = distance.replace(/풀/g, '풀코스')
        }

        races.push({
          no,
          name,
          url: `http://www.roadrun.co.kr/schedule/view.php?no=${no}`,
          distance: distance || '정보 없음',
          region: '',
          location: '',
          status: '등록중',
          race_date: `${intYear}-${month}-${day}`,
          date_label: `${currentMonth}월 ${currentDay}일`,
          day_of_week: ['일', '월', '화', '수', '목', '금', '토'][raceDate.getDay()],
          month_label: `${intYear}년 ${month}월`,
        })
      }
    }

    console.log(`✅ 목록 수집 완료: ${races.length}개`)
    console.log('🔍 상세 페이지 파싱 시작...')

    const BATCH = 3
    for (let i = 0; i < races.length; i += BATCH) {
      const batch = races.slice(i, i + BATCH)
      await Promise.all(batch.map(async (race) => {
        const { regStart, regEnd, homepageUrl, status } = await getDetailInfo(race.no)
        race.reg_start = regStart
        race.reg_end = regEnd
        race.homepage_url = homepageUrl
        race.status = status
        console.log(`  ✅ ${race.name}: ${status} (${regStart} ~ ${regEnd})`)
      }))
      await new Promise(r => setTimeout(r, 300))
    }

    const toInsert = races.map(({ no, ...rest }) => rest)

    console.log(`\n✅ 수집 완료: ${toInsert.length}개`)
    await supabase.from('races').delete().neq('id', 0)
    const { error } = await supabase.from('races').insert(toInsert)
    if (error) throw error
    console.log(`🎉 [대성공] ${toInsert.length}개 저장 완료!`)

  } catch (e) {
    console.error('오류:', e)
    process.exit(1)
  }
}

run()
