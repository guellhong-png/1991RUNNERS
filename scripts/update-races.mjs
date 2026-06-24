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
  console.log('🏃‍♂️ [그물망 모드] 로드런 사이트 정밀 탐색을 시작합니다...');
  try {
    const res = await fetch('http://www.roadrun.co.kr/schedule/list.php', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    })
    
    const buffer = await res.arrayBuffer();
    const decoder = new TextDecoder('euc-kr');
    const html = decoder.decode(buffer);
    
    // [CCTV 로그] 사이트가 올바르게 긁혀오는지 확인용
    console.log('=== [CCTV] 가져온 HTML 상단 샘플 ===');
    console.log(html.slice(0, 400));
    console.log('====================================');

    const $ = cheerio.load(html);
    const races = [];

    const totalTr = $('tr').length;
    console.log(`발견된 전체 테이블 행(tr) 개수: ${totalTr}개`);

    // 이제 칸 번호 따지지 않고 그물망식으로 샅샅이 뒤집니다.
    $('tr').each((i, el) => {
      const rowHtml = $(el).html() || '';
      const rowText = $(el).text().replace(/\s+/g, ' ').trim();
      
      // 행 내부에 상세페이지 링크(view.php)가 없다면 마라톤 정보가 아니므로 패스
      if (!rowHtml.includes('view.php')) return;

      // 대회 이름과 링크(URL) 추출
      const nameAnchor = $(el).find('a[href*="view.php"]').first();
      if (nameAnchor.length === 0) return;

      const name = nameAnchor.text().trim();
      let rawUrl = nameAnchor.attr('href') || '#';
      const url = rawUrl.startsWith('http') ? rawUrl : `http://www.roadrun.co.kr/schedule/${rawUrl}`;

      if (!name || name.length < 2) return;

      // [그물망 날짜 파싱] 행 전체 텍스트에서 날짜 패턴 유연하게 검색
      let raceDateStr = '2026-01-01';
      let year = '2026', month = '01', day = '01';

      // 1순위: 2026-03-15 또는 2026.03.15 형태 검색
      const fullDateMatch = rowText.match(/(\d{4})[-.](\d{2})[-.](\d{2})/);
      // 2순위: 연도 없이 03/15 또는 03-15 형태 검색
      const shortDateMatch = rowText.match(/(\d{2})[-./](\d{2})/);

      if (fullDateMatch) {
        year = fullDateMatch[1];
        month = fullDateMatch[2];
        day = fullDateMatch[3];
        raceDateStr = `${year}-${month}-${day}`;
      } else if (shortDateMatch) {
        month = shortDateMatch[1];
        day = shortDateMatch[2];
        raceDateStr = `2026-${month}-${day}`; // 연도 없으면 2026년으로 강제 배정
      } else {
        return; // 날짜 형식이 아예 없는 행은 버립니다.
      }

      const raceDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

      // 지역, 코스 정보 추출 (td들 중에서 대회명 제외한 텍스트 수집)
      const tds = $(el).find('td');
      let details = [];
      tds.each((_, td) => {
        const txt = $(td).text().trim();
        if (txt && txt !== name && !txt.match(/\d{2}[-./]\d{2}/)) {
          details.push(txt);
        }
      });

      const region = details[0] || '전국';
      const distance = details[1] || '풀코스, 하프, 10km';

      // 접수 상태 판단
      let status = '등록중';
      if (rowText.includes('마감') || rowText.includes('종료')) {
        status = '등록마감';
      } else if (rowText.includes('예정')) {
        status = '등록예정';
      }

      races.push({
        name,
        url,
        distance,
        region,
        location: region,
        status,
        race_date: raceDateStr,
        date_label: `${parseInt(month)}월 ${parseInt(day)}일`,
        day_of_week: ['일', '월', '화', '수', '목', '금', '토'][raceDate.getDay()] || '일',
        month_label: `${year}년 ${month.padStart(2, '0')}월`,
      });
    });

    console.log(`✅ [결과] 최종 수집된 실제 마라톤 대회: 총 ${races.length}개`);

    if (races.length > 0) {
      console.log('기존 데이터를 비우는 중...');
      await supabase.from('races').delete().neq('id', 0)

      console.log('최신 마라톤 데이터를 Supabase DB에 꽂아 넣는 중...');
      const { error: insertError } = await supabase.from('races').insert(races)
      if (insertError) throw insertError

      console.log('🎉 [완료] 데이터가 정상적으로 수집되어 연동되었습니다!');
    } else {
      console.log('❌ 테이블 행은 찾았으나 조건에 맞는 마라톤 데이터를 추출하지 못했습니다.');
    }

  } catch (e) {
    console.error('로봇 작동 오류:', e)
    process.exit(1)
  }
}

run()
