import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const targetUrl = 'https://gorunning.kr/races/'
    // corsproxy.io를 이용해 우회 접속 시도
    const fetchUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`

    const res = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
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

    if (races.length === 0) {
      races.push({
        name: `[데이터 없음] 우회 실패 상태코드: ${res.status}`,
        url: "#",
        distance: "디버깅",
        region: "원인 분석",
        location: html.substring(0, 80).replace(/</g, '['),
        status: "등록중",
        date: "2026-06-24",
        dateLabel: "에러",
        dayOfWeek: "확인",
        month: "디버깅 메시지",
      })
    }

    return NextResponse.json({ races })
  } catch (error: any) {
    return NextResponse.json({ 
      races: [{
        name: `[서버 에러] ${error.message}`,
        url: "#",
        distance: "에러",
        region: "Vercel",
        location: "서버 내부 오류",
        status: "등록마감",
        date: "2026-06-24",
        dateLabel: "에러",
        dayOfWeek: "확인",
        month: "디버깅 메시지",
      }]
    })
  }
}
