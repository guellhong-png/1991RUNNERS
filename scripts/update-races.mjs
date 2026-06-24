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
  console.log('🏃‍♂️ 블로그와 동일한 태그 분석 기법으로 로드런 파싱 시작...');
  try {
    const res = await fetch('http://www.roadrun.co.kr/schedule/list.php', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    })
    
    const buffer = await res.arrayBuffer();
    const decoder = new TextDecoder('euc-kr');
    const html = decoder.decode(buffer);
    
    // 블로그에서 쓴 BeautifulSoup처럼 진짜 태그 묶음으로 로드합니다.
    const $ = cheerio.load(html);
    const races = [];

    // 모든 테이블 행(tr)을 돌며 데이터를 정밀하게 발라냅니다.
    $('tr').each((i, el) => {
      const tds = $(el).find('td');
      if (tds.length < 5) return; // 칸이 부족한 행은 패스

      // 첫 번째 칸에서 날짜(YYYY-MM-DD 또는 YY-MM-DD 형태 등)를 찾습니다.
      const dateText = $(tds[0]).text().replace(/\s/g, '').replace(/\./g, '-');
      const dateMatch = dateText.match(/(\d{4}-\d{2}-\d{2})/);
      if (!dateMatch) return;

      const raceDateStr = dateMatch[1];
      const [year, month, day] = raceDateStr.split('-');
      const raceDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

      // 두 번째 칸에서 대회명과 링크 추출
      const nameAnchor = $(tds[1]).find('a');
      if (nameAnchor.length === 0) return;

      let rawUrl = nameAnchor.attr('href') || '#';
      const url = rawUrl.startsWith('http') ? rawUrl : `http://www.roadrun.co.kr/schedule/${rawUrl}`;
      const name = nameAnchor.text().trim();

      // 나머지 정보 가공
      const region = $(tds[2]).text().trim() || '전국';
      const location = region;
      const distance = $(tds[3]).text().trim() || '풀, 하프, 10km';
      
      // 접수 상태 판단
      const statusText = $(tds[4]).text() || '';
      let status = '등록중';
      if (statusText.includes('마감') || statusText.includes('종료')) {
        status = '등록마감';
      } else if (statusText.includes('예정')) {
        status = '등록예정';
      }

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
    });

    console.log(`✅ 대성공! 총 ${races.length}개의 실제 마라톤 대회를 찾아내어 파싱했습니다.`);

    if (races.length > 0) {
      console.log('기존 데이터를 완전히 리셋하는 중...');
      await supabase.from('races').delete().neq('id', 0)

      console.log('최신 데이터를 Supabase DB에 안전하게 업로드 중...');
      const { error: insertError } = await supabase.from('races').insert(races)
      if (insertError) throw insertError

      console.log('🎉 모든 데이터가 정상 조율 및 연동 완료되었습니다!');
    } else {
      console.log('❌ 태그 분석에 실패했거나 일치하는 데이터 포맷이 없습니다.');
    }

  } catch (e) {
    console.error('로봇 치명적 크래시:', e)
    process.exit(1)
  }
}

run()
