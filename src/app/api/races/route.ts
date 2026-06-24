import { NextResponse } from 'next/server'

// 1. Vercel이 빈 데이터를 기억하지 못하도록 매번 무조건 최신 데이터를 가져오게 강제합니다.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const res = await fetch('https://gorunning.kr/races/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      // 이전의 캐시 설정(revalidate) 삭제
    })

    const html = await res.text()
    const races: any[] = []

    const monthBlocks = html.split(/<h2[^>]*>/i)
    for (const block of monthBlocks) {
      const monthMatch = block.match(/(\d{4})\s*년\s*(\d{1,2})\s*월/)
      if (!monthMatch) continue
      const year = parseInt(monthMatch[1])
      const month = parseInt(monthMatch[2])

      const dayBlocks = block.split(/<h3[^>]*>/i)
      for (const dayBlock of dayBlocks) {
        const dateMatch = dayBlock.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/)
        if (!dateMatch) continue
        const raceMonth = parseInt(dateMatch[1])
        const raceDay = parseInt(dateMatch[2])
        const raceDate = new Date(year, raceMonth - 1, raceDay)

        // 2. 과거 대회 숨김 로직을 임시로 해제했습니다. (데이터가 들어오는지 확인하기 위함)
        // if (raceDate < new Date()) continue

        const rowMatches = dayBlock.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)
        for (const rowMatch of rowMatches) {
          const row = rowMatch[1]
          const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim())
          
          if (cells.length < 4) continue

          const nameMatch = row.match(/href\s*=\s*"([^"]+)"[^>]*>([\s\S]*?)<\/a>/i)
          if (!nameMatch) continue

          const rawName = nameMatch[2].replace(/<[^>]+>/g, '').trim()
          const url = nameMatch[1].startsWith('http') ? nameMatch[1] : `https://gorunning.kr${nameMatch[1]}`
          const distance = cells[2] || ''
          const region = cells[3] || ''
          const location = cells[4] || ''
          const statusRaw = cells[cells.length - 1] || ''

          let status = '등록마감'
          if (statusRaw.includes('등록중')) status = '등록중'
          else if (statusRaw.includes('예정')) status = '등록예정'

          if (rawName && rawName.length > 1) {
            races.push({
              name: rawName,
              url,
              distance,
              region,
              location,
              status,
              date: raceDate.toISOString().split('T')[0],
              dateLabel: `${raceMonth}월 ${raceDay}일`,
              dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][raceDate.getDay()],
              month: `${year}년 ${String(raceMonth).padStart(2, '0')}월`,
            })
          }
        }
      }
    }

    return NextResponse.json({ races })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch', races: [] }, { status: 500 })
  }
}
