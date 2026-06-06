import { AI_MODEL, AI_MAX_TOKENS, API_KEY_LOCAL_KEY } from '../constants/ai.js';

export function getApiKey() {
  return localStorage.getItem(API_KEY_LOCAL_KEY) ?? '';
}

export function saveApiKey(key) {
  localStorage.setItem(API_KEY_LOCAL_KEY, key.trim());
}

/**
 * 연습 세션 데이터를 Claude API에 전달하고 AI 리뷰를 생성한다.
 * @param {{ duration: number, note: { rating: number, wellDone: string, tomorrow: string } | null }} session
 * @returns {Promise<{ success: boolean, review?: string, error?: string }>}
 */
export async function generatePracticeReview(session) {
  const apiKey = getApiKey();
  if (!apiKey) return { success: false, error: 'no_key' };

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: AI_MAX_TOKENS,
        messages: [{ role: 'user', content: buildPrompt(session) }],
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error?.message ?? `오류 ${res.status}` };
    }

    const data = await res.json();
    return { success: true, review: data.content[0].text };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * 연습 시작 전 AI 자세 가이드 생성.
 * @param {{ streak: number, totalDays: number }} stats
 * @returns {Promise<{ success: boolean, guide?: string, error?: string }>}
 */
export async function generatePostureGuide(stats) {
  const apiKey = getApiKey();
  if (!apiKey) return { success: false, error: 'no_key' };

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 500,
        messages: [{ role: 'user', content: buildPosturePrompt(stats) }],
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error?.message ?? `오류 ${res.status}` };
    }

    const data = await res.json();
    return { success: true, guide: data.content[0].text };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * 연간 리포트 AI 총평 생성.
 * @param {{ year: number, totalDays: number, totalHours: number, totalMins: number,
 *           longestStreak: number, currentStreak: number,
 *           badgeCount: number, badgeNames: string, topMonth: string }} stats
 * @returns {Promise<{ success: boolean, review?: string, error?: string }>}
 */
export async function generateAnnualReview(stats) {
  const apiKey = getApiKey();
  if (!apiKey) return { success: false, error: 'no_key' };

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 800,
        messages: [{ role: 'user', content: buildAnnualPrompt(stats) }],
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error?.message ?? `오류 ${res.status}` };
    }

    const data = await res.json();
    return { success: true, review: data.content[0].text };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function buildAnnualPrompt({ year, totalDays, totalHours, totalMins, longestStreak, currentStreak, badgeCount, badgeNames, topMonth }) {
  return `당신은 피아노 연습 코치입니다. 50대 성인 독학자(목표: 베토벤 비창 2악장 완주)의 ${year}년 연습 기록을 보고 연간 총평을 작성해 주세요. 따뜻하게 격려하며 내년 방향을 제안하세요. 한국어로 답변하세요.

## ${year}년 연습 기록
- 연습일: ${totalDays}일
- 총 연습 시간: ${totalHours}시간 ${totalMins}분
- 최장 스트릭: ${longestStreak}일
- 현재 스트릭: ${currentStreak}일
- 획득 배지: ${badgeCount}개${badgeNames ? ` (${badgeNames})` : ''}
- 가장 열심히 한 달: ${topMonth}

## 답변 형식 (반드시 이 형식으로)
**${year}년 총평**
(2~3문장. 구체적 기록을 언급하며 격려)

**내년 제안**
- (제안 1)
- (제안 2)
- (제안 3)`;
}

function buildPosturePrompt({ streak, totalDays }) {
  return `당신은 피아노 연습 코치입니다. 50대 성인 피아노 독학자(${streak}일 연속 연습 중, 누적 ${totalDays}일 연습, 목표: 베토벤 비창 2악장)가 지금 막 연습을 시작하려 합니다. 오늘의 자세 포인트를 아주 간결하게 알려주세요. 한국어로 답변하세요.

## 답변 형식 (반드시 이 형식으로, 각 항목은 1~2문장 이내)
**오늘의 포인트**
(오늘 특히 신경 써야 할 자세 포인트 1가지)

**주의**
- (한 가지 구체적 주의사항)

**시작 전 스트레칭**
(10초 이내 간단한 스트레칭 1가지)`;
}

function buildPrompt(session) {
  const mins   = Math.round((session.duration ?? 0) / 60);
  const note   = session.note ?? {};
  const rating = note.rating ? `${note.rating}점/5점` : '미입력';

  return `당신은 피아노 연습 코치입니다. 50대 성인 피아노 독학자(최종 목표: 베토벤 비창 2악장 완주)의 오늘 연습 기록을 보고 따뜻하게 격려하며 내일 계획을 제안해 주세요. 한국어로 답변하세요.

## 오늘 연습 기록
- 연습 시간: ${mins}분
- 잘된 점: ${note.wellDone || '(미입력)'}
- 내일 목표: ${note.tomorrow || '(미입력)'}
- 자기 평가: ${rating}

## 답변 형식 (반드시 이 형식으로)
**오늘 총평**
(2~3문장. 기록된 내용을 언급하며 구체적으로 격려)

**내일 연습 제안**
- (제안 1)
- (제안 2)
- (제안 3)`;
}
