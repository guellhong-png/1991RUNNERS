import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('환경변수가 세팅되지 않았습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('🏃‍♂️ 마라톤온라인으로 로봇 출발합니다...')
  try {
    // 마라톤온라인은 사람처럼 보이도록 아래 헤더 세팅이 핵심입니다.
    const res = await fetch('http://www.marathon.pe.kr/schedule/index.html', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    })
    
    // 이 사이트는 한글이 깨지지 않게 구형 인코딩(EUC-KR) 처리가 필요한 경우가 있어 텍스트를 정밀하게 받아옵니다.
    const buffer = await res.arrayBuffer();
    const decoder = new TextDecoder('euc-kr');
    const html = decoder.decode(buffer);
    
    const races = []

    // 마라톤온라인의 HTML 구조(테이블)에서 데이터를 뽑아내는 규칙입니다.
    const rowMatches = html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)
    
    for (const rowMatch of rowMatches) {
      const row = rowMatch[1]
      // td 태그 안의 텍스트들을 청소해서 가져옴
      const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim())
      
      // 마라톤온라인 스케줄 테이블 구조에 맞게 필터링 (날짜, 대회명, 장소 등이 있는 행만)
      if (cells.length < 5 || !cells[0].match(/\d{2}\/\d{2}/)) continue

      const nameMatch = row.match(/href\s*=\s*"([^"]+)"[^>]*>([\s\S]*?)<\/a>/i)
      const url = nameMatch ? (nameMatch[1].startsWith('http') ? nameMatch[1] : `http://www.marathon.pe.kr/schedule/${nameMatch[1]}`) : '#'
      const rawName = nameMatch ? nameMatch[2].replace(/<[^>]+>/g, '').trim() : cells[1]

      // 날짜 파싱 (예: "03/15" -> "2026-03-15")
      const [mm, dd] = cells[0].split('/')
      const currentYear = new Date().getFullYear() // 2026
      const raceDateStr = `${currentYear}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
      const raceDate = new Date(currentYear, parseInt(mm) - 1, parseInt(dd))

      // 접수 상태 판단
      let status = '등록중'
      if (row.includes('마감') || html.includes('종료')) status = '등록마감'

      if (rawName && rawName.length > 1) {
        races.push({
          name: rawName,
          url,
          distance: cells[2] || '일반', 
          region: cells[3] || '전국',    
          location: cells[3] || '상세장소 참조', 
          status,
          race_date: raceDateStr,
          date_label: `${parseInt(mm)}월 ${parseInt(dd)}일`,
          day_of_week: ['일', '월', '화', '수', '목', '금', '토'][raceDate.getDay()] || '일',
          month_label: `${currentYear}년 ${mm.padStart(2, '0')}월`,
        })
      }
    }

    console.log(`✅ 총 ${races.length}개의 실제 대회를 찾았습니다!`)

    if (races.length > 0) {
      console.log('기존 테스트 데이터를 삭제하는 중...')
      await supabase.from('races').delete().neq('id', 0)

      console.log('최신 데이터를 Supabase에 저장하는 중...')
      const { error: insertError } = await supabase.from('races').insert(races)
      if (insertError) throw insertError

      console.log('🎉 Supabase 자동 업데이트 완벽 종료!')
    } else {
      console.log('❌ 크롤링된 데이터가 없습니다. 주소를 다시 확인해 주세요.')
    }

  } catch (e) {
    console.error('에러 발생:', e)
    process.exit(1)
  }
}

run()
