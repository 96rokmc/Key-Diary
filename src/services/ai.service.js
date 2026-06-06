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
