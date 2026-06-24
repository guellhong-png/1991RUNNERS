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
  console.log('🏃‍♂️ [정밀 검독 모드] 로드런 사이트 탐색을 시작합니다...');
  try {
    const res = await fetch('http://www.roadrun.co.kr/schedule/list.php', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    })
    
    const buffer = await res.arrayBuffer();
    const decoder = new TextDecoder('euc-kr');
    const html = decoder.decode(buffer);

    const $ = cheerio.load(html);
    const races = [];

    $('tr').each((i, el) => {
      const rowHtml = $(el).html() || '';
      const rowText = $(el).text().replace(/\s+/g, ' ').trim();
      
      if (!rowHtml.includes('view.php')) return;

      const nameAnchor = $(el).find('a[href*="view.php"]').first();
      if (nameAnchor.length === 0) return;

      const name = nameAnchor.text().trim();
      let rawUrl = nameAnchor.attr('href') || '#';
      const url = rawUrl.startsWith('http') ? rawUrl : `http://www.roadrun.co.kr/schedule/${rawUrl}`;

      if (!name || name.length < 2) return;

      let year = '2026', month = '01', day = '01';

      const fullDateMatch = rowText.match(/(\d{4})[-.](\d{2})[-.](\d{2})/);
      const shortDateMatch = rowText.match(/(\d{2})[-./](\d{2})/);

      if (fullDateMatch) {
        year = fullDateMatch[1];
        month = fullDateMatch[2];
        day = fullDateMatch[3];
      } else if (shortDateMatch) {
        month = shortDateMatch[1];
        day = shortDateMatch[2];
        year = '2026';
      } else {
        return;
      }

      // 🚨 [핵심 수정] 달력에 없는 가짜 날짜 (예: 10월 38일 등) 검사 메커니즘
      const intYear = parseInt(year);
      const intMonth = parseInt(month);
      const intDay = parseInt(day);

      // 월은 1~12, 일은 1~31 범위 체크
      if (intMonth < 1 || intMonth > 12 || intDay < 1 || intDay > 31) return;

      const raceDate = new Date(intYear, intMonth - 1, intDay);
      
      // JavaScript Date 객체가 자동으로 일수를 올림했는지 검증 (예: 10월 38일 입력시 11월 7일로 바뀌는 현상 방지)
      if (raceDate.getFullYear() !== intYear || (raceDate.getMonth() + 1) !== intMonth || raceDate.getDate() !== intDay) {
        console.log(`⚠️ 유령 날짜 감지 및 제외: ${year}-${month}-${day} (${name})`);
        return; // 가짜 날짜는 저장하지 않고 즉시 스킵!
      }

      const raceDateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

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
        date_label: `${intMonth}월 ${intDay}일`,
        day_of_week: ['일', '월', '화', '수', '목', '금', '토'][raceDate.getDay()] || '일',
        month_label: `${year}년 ${month.padStart(2, '0')}월`,
      });
    });

    console.log(`✅ [필터링 완료] 최종 수집된 정상 마라톤 대회: 총 ${races.length}개`);

    if (races.length > 0) {
      console.log('기존 데이터를 비우는 중...');
      await supabase.from('races').delete().neq('id', 0)

      console.log('최신 마라톤 데이터를 Supabase DB에 밀어 넣는 중...');
      const { error: insertError } = await supabase.from('races').insert(races)
      if (insertError) throw insertError

      console.log('🎉 [대성공] 모든 데이터가 정상적으로 수집 및 저장 완료되었습니다!');
    } else {
      console.log('❌ 수집된 정상 데이터가 없습니다.');
    }

  } catch (e) {
    console.error('로봇 작동 오류:', e)
    process.exit(1)
  }
}

run()
