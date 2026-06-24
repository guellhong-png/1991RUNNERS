import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://gorunning.kr/races/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 }
    })

    const html = await res.text()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const races: any[] = []

    const monthBlocks = html.split('<h2>')
    for (const block of monthBlocks) {
      const monthMatch = block.match(/(\d{4})년\s+(\d{2})월/)
      if (!monthMatch) continue
      const year = parseInt(monthMatch[1])
      const month = parseInt(monthMatch[2])

      const dayBlocks = block.split('<h3>')
      for (const dayBlock of dayBlocks) {
        const dateMatch = dayBlock.match(/(\d{2})월\s+(\d{2})일/)
        if (!dateMatch) continue
        const raceMonth = parseInt(dateMatch[1])
        const raceDay = parseInt(dateMatch[2])
        const raceDate = new Date(year, raceMonth - 1, raceDay)
        if (raceDate < today) continue

        const rowMatches = dayBlock.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)
        for (const rowMatch of rowMatches) {
          const row = rowMatch[1]
          const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim())
          if (cells.length < 5) continue

          const nameMatch = row.match(/href="([^"]+)"[^>]*>([^<]+)</)
          if (!nameMatch) continue

          const name = nameMatch[2].trim()
          const url = nameMatch[1].startsWith('http') ? nameMatch[1] : `https://gorunning.kr${nameMatch[1]}`
          const distance = cells[2] || ''
          const region = cells[3] || ''
          const location = cells[4] || ''
          const statusRaw = cells[cells.length - 1] || ''

          let status = '등록마감'
          if (statusRaw.includes('등록중')) status = '등록중'
          else if (statusRaw.includes('예정')) status = '등록예정'

          if (name && name.length > 1) {
            races.push({
              name,
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
