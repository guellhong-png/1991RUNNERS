import { NextResponse } from 'next/server'
import { JSDOM } from 'jsdom'

export async function GET() {
  try {
    const res = await fetch('https://gorunning.kr/races/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 }
    })

    const html = await res.text()
    const dom = new JSDOM(html)
    const document = dom.window.document

    const races: any[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const monthSections = document.querySelectorAll('h2')

    monthSections.forEach((monthEl) => {
      const monthText = monthEl.textContent?.trim() ?? ''
      const monthMatch = monthText.match(/(\d{4})년\s+(\d{2})월/)
      if (!monthMatch) return

      const year = parseInt(monthMatch[1])
      const month = parseInt(monthMatch[2])

      let el = monthEl.nextElementSibling
      while (el && el.tagName !== 'H2') {
        if (el.tagName === 'H3') {
          const dateText = el.textContent?.trim() ?? ''
          const dateMatch = dateText.match(/(\d{2})월\s+(\d{2})일/)
          if (dateMatch) {
            const raceMonth = parseInt(dateMatch[1])
            const raceDay = parseInt(dateMatch[2])
            const raceDate = new Date(year, raceMonth - 1, raceDay)

            if (raceDate >= today) {
              let tableEl = el.nextElementSibling
              while (tableEl && tableEl.tagName !== 'H3' && tableEl.tagName !== 'H2') {
                if (tableEl.tagName === 'TABLE') {
                  const rows = tableEl.querySelectorAll('tbody tr')
                  rows.forEach((row) => {
                    const cells = row.querySelectorAll('td')
                    if (cells.length >= 6) {
                      const nameEl = cells[1].querySelector('a')
                      const name = nameEl?.textContent?.trim() ?? ''
                      const url = nameEl?.getAttribute('href') ?? ''
                      const distance = cells[2].textContent?.trim() ?? ''
                      const region = cells[3].textContent?.trim() ?? ''
                      const location = cells[4].textContent?.trim() ?? ''
                      const statusText = cells[6]?.textContent?.trim() ?? cells[5]?.textContent?.trim() ?? ''

                      let status = '등록마감'
                      if (statusText.includes('등록중')) status = '등록중'
                      else if (statusText.includes('등록예정') || statusText.includes('예정')) status = '등록예정'

                      if (name) {
                        races.push({
                          name,
                          url: url.startsWith('http') ? url : `https://gorunning.kr${url}`,
                          distance,
                          region,
                          location,
                          status,
                          date: raceDate.toISOString().split('T')[0],
                          dateLabel: `${raceMonth}월 ${raceDay}일`,
                          month: `${year}년 ${String(raceMonth).padStart(2, '0')}월`,
                        })
                      }
                    }
                  })
                }
                tableEl = tableEl.nextElementSibling
              }
            }
          }
        }
        el = el.nextElementSibling
      }
    })

    return NextResponse.json({ races })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch races', races: [] }, { status: 500 })
  }
}
