import { createClient } from '@supabase/supabase-js'

// GitHub Secrets에서 가져올 Supabase 환경변수
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // 데이터를 강제로 넣기 위한 관리자 키

if (!supabaseUrl || !supabaseKey) {
  console.error('환경변수가 세팅되지 않았습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('🏃‍♂️ 크롤링 로봇 출발합니다...')
  try {
    const res = await fetch('https://gorunning.kr/races/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      }
    })
    const html = await res.text()
    const races = []

    const monthBlocks = html.split(/<h2[^>]*>/i)
    for (let i = 1; i < monthBlocks.length; i++) {
      const block = monthBlocks[i]
      const monthMatch = block.match(/(\d{4})\s*년\s*(\d{1,2})\s*월/)
      if (!monthMatch) continue
      
      const year = parseInt(monthMatch[1])
      const month = parseInt(monthMatch[2])

      const dayBlocks = block.split(/<h3[^>]*>/i)
      for (let j = 1; j < dayBlocks.length; j++) {
        const dayBlock = dayBlocks[j]
        const dateMatch = dayBlock.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/)
        if (!dateMatch) continue
        
        const raceMonth = parseInt(dateMatch[1])
        const raceDay = parseInt(dateMatch[2])
        
        const monthStr = String(raceMonth).padStart(2, '0')
        const dayStr = String(raceDay).padStart(2, '0')
        const raceDateStr = `${year}-${monthStr}-${dayStr}`
        const raceDate = new Date(year, raceMonth - 1, raceDay)

        const rowMatches = dayBlock.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)
        for (const rowMatch of rowMatches) {
          const row = rowMatch[1]
          const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim())
          if (cells.length < 4) continue

          const nameMatch = row.match(/href\s*=\s*"([^"]+)"[^>]*>([\s\S]*?)<\/a>/i)
          if (!nameMatch) continue

          const rawName = nameMatch[2].replace(/<[^>]+>/g, '').trim()
          const url = nameMatch[1].startsWith('http') ? nameMatch[1] : `https://gorunning.kr${nameMatch[1]}`

          let status = '등록마감'
          const statusRaw = cells[cells.length - 1] || ''
          if (statusRaw.includes('등록중')) status = '등록중'
          else if (statusRaw.includes('예정')) status = '등록예정'

          if (rawName && rawName.length > 1) {
            races.push({
              name: rawName,
              url,
              distance: cells[2] || '',
              region: cells[3] || '',
              location: cells[4] || '',
              status,
              race_date: raceDateStr,
              date_label: `${raceMonth}월 ${raceDay}일`,
              day_of_week: ['일', '월', '화', '수', '목', '금', '토'][raceDate.getDay()],
              month_label: `${year}년 ${monthStr}월`,
            })
          }
        }
      }
    }

    console.log(`✅ 총 ${races.length}개의 데이터를 찾았습니다!`)

    if (races.length > 0) {
      // 1. 기존 데이터를 싹 지우고 (최신화)
      console.log('기존 데이터를 삭제하는 중...')
      await supabase.from('races').delete().neq('id', 0)

      // 2. 새 데이터를 집어넣습니다.
      console.log('새 데이터를 Supabase에 저장하는 중...')
      const { error: insertError } = await supabase.from('races').insert(races)
      if (insertError) throw insertError

      console.log('🎉 Supabase 업데이트 완벽하게 종료!')
    } else {
      console.log('❌ 크롤링된 데이터가 없습니다. (고러닝 사이트가 변경되었거나 막혔을 수 있습니다)')
    }

  } catch (e) {
    console.error('에러 발생:', e)
    process.exit(1)
  }
}

run()
