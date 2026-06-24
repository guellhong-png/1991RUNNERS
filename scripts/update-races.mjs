import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('환경변수가 세팅되지 않았습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('🏃‍♂️ 블로그 비법 반영! 로드런(roadrun.co.kr)으로 로봇 출발합니다...')
  try {
    // 1. 방화벽 없는 로드런 사이트의 대회 일정 페이지 요청
    const res = await fetch('http://www.roadrun.co.kr/schedule/list.php', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    })
    
    // 이 사이트는 한글 깨짐 방지를 위해 EUC-KR 디코딩이 필수입니다.
    const buffer = await res.arrayBuffer();
    const decoder = new TextDecoder('euc-kr');
    const html = decoder.decode(buffer);
    
    const races = []

    // 2. HTML 구조에서 테이블의 행(tr)들을 정밀 파싱합니다.
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const trMatches = [...html.matchAll(trRegex)];

    for (const match of trMatches) {
      const trContent = match[1];
      
      // td 태그 안의 순수 텍스트 추출
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells = [...trContent.matchAll(tdRegex)].map(m => {
        return m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
      });

      // 로드런 사이트 특성상 유효한 대회 리스트 행만 필터링 (링크가 있고 날짜 형태가 맞아야 함)
      if (cells.length >= 5 && trContent.includes('view.php')) {
        
        // 대회 상세 링크와 진짜 대회 이름 추출
        const linkMatch = trContent.match(/href\s*=\s*['"]?([^'"]*view\.php[^'"]*)['"]?[^>]*>([\s\S]+?)<\/a>/i);
        let url = '#';
        let name = cells[1];

        if (linkMatch) {
          url = `http://www.roadrun.co.kr/schedule/${linkMatch[1].trim()}`;
          name = linkMatch[2].replace(/<[^>]+>/g, '').trim();
        }

        // 날짜 파싱 (로드런은 보통 "2026-03-15" 또는 "2026.03.15" 형태로 들어옵니다)
        const dateRaw = cells.find(c => c.match(/^\d{4}[-.]\d{2}[-.]\d{2}$/));
        if (!dateRaw) continue;

        const raceDateStr = dateRaw.replace(/\./g, '-');
        const [year, month, day] = raceDateStr.split('-');
        const raceDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        // 접수 상태 판단 (텍스트 기반)
        let status = '등록중';
        if (trContent.includes('마감') || trContent.includes('종료') || cells.join(' ').includes('마감')) {
          status = '등록마감';
        } else if (trContent.includes('예정')) {
          status = '등록예정';
        }

        // 장소 및 코스 추출
        const region = cells[2] || '전국';
        const location = cells[2] || '상세내용 참조';
        const distance = cells[3] || '풀코스, 하프, 10km';

        if (name && name.length > 1) {
          races.push({
            name,
            url,
            distance,
            region,
            location,
            status,
            race_date: raceDateStr,
            date_label: `${parseInt(month)}월 ${parseInt(day)}일`,
            day_of_week: ['일', '월', '화', '수', '목', '금', '토'][raceDate.getDay()] || '일',
            month_label: `${year}년 ${month}월`,
          });
        }
      }
    }

    console.log(`✅ 대성공! 로드런 사이트에서 총 ${races.length}개의 고퀄리티 대회를 긁어왔습니다.`);

    if (races.length > 0) {
      console.log('기존 임시 테스트 데이터 삭제 중...');
      await supabase.from('races').delete().neq('id', 0)

      console.log('최신 로드런 데이터를 Supabase DB에 저장 중...');
      const { error: insertError } = await supabase.from('races').insert(races)
      if (insertError) throw insertError

      console.log('🎉 로드런 자동 업데이트 완벽하게 완료되었습니다!');
    } else {
      console.log('❌ 데이터를 찾지 못했습니다. 구조나 주소를 다시 확인해 주세요.');
    }

  } catch (e) {
    console.error('로봇 치명적 에러 발생:', e)
    process.exit(1)
  }
}

run()
