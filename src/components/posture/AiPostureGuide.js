import { getApiKey, generatePostureGuide } from '../../services/ai.service.js';
import { getStreakData } from '../../stores/streak.store.js';

/**
 * 연습 시작 전 AI 자세 팁 위젯.
 * PostureCheck 하단에 삽입 — API 키 없으면 힌트 문구만 표시.
 *
 * @returns {HTMLElement}
 */
export function AiPostureGuide() {
  const el = document.createElement('div');
  el.className = 'apg';

  // idle | loading | done | error | no_key
  let status  = 'idle';
  let guideHtml = '';
  let errMsg    = '';

  function render() {
    if (status === 'idle') {
      el.innerHTML = `
        <button class="apg__trigger" type="button" id="apg-trigger">
          AI 자세 팁 받기
        </button>
      `;
      el.querySelector('#apg-trigger').addEventListener('click', request);

    } else if (status === 'loading') {
      el.innerHTML = `
        <div class="apg__card apg__card--loading">
          <span class="apg__spinner" aria-hidden="true"></span>
          <span class="apg__loading-text">자세 가이드 생성 중…</span>
        </div>
      `;

    } else if (status === 'done') {
      el.innerHTML = `
        <div class="apg__card">
          <div class="apg__content">${guideHtml}</div>
          <button class="apg__refresh" type="button" id="apg-refresh">↻ 다시 받기</button>
        </div>
      `;
      el.querySelector('#apg-refresh').addEventListener('click', request);

    } else if (status === 'error') {
      el.innerHTML = `
        <div class="apg__card apg__card--err">
          <span>오류: ${errMsg}</span>
          <button class="apg__refresh" type="button" id="apg-retry">다시 시도</button>
        </div>
      `;
      el.querySelector('#apg-retry').addEventListener('click', request);

    } else if (status === 'no_key') {
      el.innerHTML = `
        <p class="apg__hint">AI 자세 팁을 사용하려면 연습 후 AI 코치에서 API 키를 먼저 저장하세요.</p>
      `;
    }
  }

  async function request() {
    if (!getApiKey()) {
      status = 'no_key';
      render();
      return;
    }

    status = 'loading';
    render();

    const { currentStreak, totalDays } = getStreakData();
    const result = await generatePostureGuide({ streak: currentStreak, totalDays });

    if (!result.success) {
      status  = 'error';
      errMsg  = result.error === 'no_key' ? 'API 키 없음' : result.error;
    } else {
      status    = 'done';
      guideHtml = mdToHtml(result.guide);
    }

    render();
  }

  render();
  return el;
}

function mdToHtml(text) {
  const lines = text.split('\n');
  let html   = '';
  let inList = false;

  for (const line of lines) {
    if (line.startsWith('- ')) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</li>`;
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      html += formatted ? `<p>${formatted}</p>` : '';
    }
  }

  if (inList) html += '</ul>';
  return html;
}
