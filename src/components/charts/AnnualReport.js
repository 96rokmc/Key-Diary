import './annual-report.css';
import { getSessions, getAllRepertoire } from '../../services/storage.service.js';
import { getStreakData } from '../../stores/streak.store.js';
import { getApiKey, generateAnnualReview } from '../../services/ai.service.js';
import { BADGES } from '../../constants/badges.js';

const MONTHS_KR = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

/**
 * 연간 리포트 패널.
 * 올해 연습 통계 · 월별 현황 · 레퍼토리 진행 · 배지 · AI 연간 총평을 표시.
 *
 * @returns {HTMLElement}
 */
export function AnnualReport() {
  const el   = document.createElement('div');
  el.className = 'annual-report';

  const year = new Date().getFullYear();

  let sessionsThisYear = [];
  let monthlyCounts    = new Array(12).fill(0);
  let repertoireList   = [];
  let streakData       = {};

  let reviewStatus = 'idle';  // idle | loading | done | error | no_key
  let reviewHtml   = '';
  let reviewErr    = '';

  // ── 초기 로딩 스켈레톤 ──────────────────────────────────────
  el.innerHTML = `
    <div class="ar-skeleton">
      <div class="ar-skeleton__bar" style="width:40%"></div>
      <div class="ar-skeleton__bar" style="width:100%"></div>
      <div class="ar-skeleton__bar" style="width:100%;height:80px"></div>
    </div>
  `;

  async function loadData() {
    streakData = getStreakData();
    [sessionsThisYear, repertoireList] = await Promise.all([
      getSessions({ from: `${year}-01-01`, to: `${year}-12-31` }),
      getAllRepertoire(),
    ]);

    monthlyCounts = new Array(12).fill(0);
    const seenDates = new Set();
    for (const s of sessionsThisYear) {
      if (!seenDates.has(s.date)) {
        seenDates.add(s.date);
        const m = parseInt(s.date.split('-')[1], 10) - 1;
        monthlyCounts[m]++;
      }
    }

    render();
  }

  // ── 메인 렌더 ─────────────────────────────────────────────
  function render() {
    const practicedDays = new Set(sessionsThisYear.map((s) => s.date)).size;
    const totalSecs     = sessionsThisYear.reduce((sum, s) => sum + (s.duration ?? 0), 0);
    const totalHours    = Math.floor(totalSecs / 3600);
    const totalMins     = Math.floor((totalSecs % 3600) / 60);

    const maxCount      = Math.max(...monthlyCounts, 1);
    const topMonthIdx   = monthlyCounts.indexOf(Math.max(...monthlyCounts));

    const earnedBadges  = (streakData.badges ?? [])
      .map((b) => BADGES.find((bd) => bd.id === b.id))
      .filter(Boolean);

    const mainPiece = repertoireList.find((r) => r.id === 'beethoven_pathetique_2')
      ?? repertoireList.find((r) => r.status === 'in_progress')
      ?? null;

    el.innerHTML = `
      <header class="ar-header">
        <div>
          <h2 class="ar-title">나의 피아노 여정</h2>
          <p class="ar-year">${year}년</p>
        </div>
        <p class="ar-goal">목표: 비창 2악장 완주</p>
      </header>

      <div class="ar-stats-grid">
        <div class="ar-stat">
          <span class="ar-stat__value">${practicedDays}</span>
          <span class="ar-stat__label">연습일</span>
        </div>
        <div class="ar-stat">
          <span class="ar-stat__value">${totalHours > 0 ? totalHours + 'h ' : ''}${totalMins}m</span>
          <span class="ar-stat__label">연습 시간</span>
        </div>
        <div class="ar-stat">
          <span class="ar-stat__value">${streakData.longestStreak ?? 0}</span>
          <span class="ar-stat__label">최장 스트릭</span>
        </div>
        <div class="ar-stat">
          <span class="ar-stat__value">${earnedBadges.length}</span>
          <span class="ar-stat__label">배지</span>
        </div>
      </div>

      <section class="ar-section">
        <h3 class="ar-section__title">월별 연습 현황</h3>
        <div class="ar-monthly" aria-label="월별 연습 일수">
          ${monthlyCounts.map((count, i) => `
            <div class="ar-month">
              <div class="ar-month__bar-wrap" title="${MONTHS_KR[i]}: ${count}일">
                <div class="ar-month__bar ${count === 0 ? 'ar-month__bar--empty' : ''}"
                     style="height:${Math.round((count / maxCount) * 100)}%"
                     aria-label="${MONTHS_KR[i]} ${count}일"></div>
              </div>
              <span class="ar-month__label">${i + 1}</span>
            </div>
          `).join('')}
        </div>
        ${practicedDays > 0
          ? `<p class="ar-monthly__top">가장 열심히 한 달: <strong>${MONTHS_KR[topMonthIdx]} (${monthlyCounts[topMonthIdx]}일)</strong></p>`
          : '<p class="ar-monthly__top">아직 연습 기록이 없습니다</p>'
        }
      </section>

      ${mainPiece ? `
      <section class="ar-section">
        <h3 class="ar-section__title">레퍼토리 진행</h3>
        <div class="ar-piece">
          <div class="ar-piece__info">
            <span class="ar-piece__title">${mainPiece.title}</span>
            <span class="ar-piece__composer">${mainPiece.composer}</span>
          </div>
          <div class="ar-piece__progress">
            <div class="ar-piece__bar">
              <div class="ar-piece__fill"
                   style="width:${Math.min(100, Math.round(((mainPiece.learnedMeasures ?? 0) / (mainPiece.totalMeasures ?? 73)) * 100))}%"></div>
            </div>
            <span class="ar-piece__pct">${mainPiece.learnedMeasures ?? 0} / ${mainPiece.totalMeasures ?? 73} 마디</span>
          </div>
          <div class="ar-piece__bpm">
            <span class="ar-piece__bpm-val">${mainPiece.currentBpm ?? '—'} BPM</span>
            <span class="ar-piece__bpm-goal">목표 ${mainPiece.targetBpm ?? 88} BPM</span>
          </div>
        </div>
      </section>
      ` : ''}

      ${earnedBadges.length > 0 ? `
      <section class="ar-section">
        <h3 class="ar-section__title">획득한 배지</h3>
        <div class="ar-badges">
          ${earnedBadges.map((b) => `
            <div class="ar-badge" title="${b.description}">
              <span class="ar-badge__icon" aria-hidden="true">${b.icon}</span>
              <span class="ar-badge__label">${b.label}</span>
            </div>
          `).join('')}
        </div>
      </section>
      ` : ''}

      <section class="ar-section ar-section--ai" id="ar-ai-section"></section>
    `;

    renderAiSection();
  }

  // ── AI 총평 섹션 ───────────────────────────────────────────
  function renderAiSection() {
    const sec = el.querySelector('#ar-ai-section');
    if (!sec) return;

    if (reviewStatus === 'idle') {
      sec.innerHTML = `
        <button class="ar-ai-btn" type="button" id="ar-ai-trigger">
          ✦ AI 연간 총평 받기
        </button>
      `;
      sec.querySelector('#ar-ai-trigger').addEventListener('click', requestReview);

    } else if (reviewStatus === 'loading') {
      sec.innerHTML = `
        <div class="ar-ai-card ar-ai-card--loading">
          <span class="ar-spinner" aria-hidden="true"></span>
          <span class="ar-ai-loading">연간 리포트 생성 중…</span>
        </div>
      `;

    } else if (reviewStatus === 'done') {
      sec.innerHTML = `
        <div class="ar-ai-card">
          <h3 class="ar-section__title">AI 연간 총평</h3>
          <div class="ar-ai-content">${reviewHtml}</div>
          <button class="ar-ai-refresh" type="button" id="ar-ai-refresh">↻ 다시 받기</button>
        </div>
      `;
      sec.querySelector('#ar-ai-refresh').addEventListener('click', requestReview);

    } else if (reviewStatus === 'error') {
      sec.innerHTML = `
        <div class="ar-ai-card ar-ai-card--err">
          <span>오류: ${reviewErr}</span>
          <button class="ar-ai-refresh" type="button" id="ar-ai-retry">다시 시도</button>
        </div>
      `;
      sec.querySelector('#ar-ai-retry').addEventListener('click', requestReview);

    } else if (reviewStatus === 'no_key') {
      sec.innerHTML = `
        <p class="ar-ai-hint">AI 총평을 받으려면 AI 코치에서 API 키를 먼저 저장하세요.</p>
      `;
    }
  }

  async function requestReview() {
    if (!getApiKey()) {
      reviewStatus = 'no_key';
      renderAiSection();
      return;
    }

    reviewStatus = 'loading';
    renderAiSection();

    const practicedDays = new Set(sessionsThisYear.map((s) => s.date)).size;
    const totalSecs     = sessionsThisYear.reduce((sum, s) => sum + (s.duration ?? 0), 0);
    const topMonthIdx   = monthlyCounts.indexOf(Math.max(...monthlyCounts));
    const earnedBadges  = (streakData.badges ?? [])
      .map((b) => BADGES.find((bd) => bd.id === b.id))
      .filter(Boolean);

    const result = await generateAnnualReview({
      year,
      totalDays:     practicedDays,
      totalHours:    Math.floor(totalSecs / 3600),
      totalMins:     Math.floor((totalSecs % 3600) / 60),
      longestStreak: streakData.longestStreak ?? 0,
      currentStreak: streakData.currentStreak ?? 0,
      badgeCount:    earnedBadges.length,
      badgeNames:    earnedBadges.map((b) => b.label).join(', '),
      topMonth:      practicedDays > 0 ? MONTHS_KR[topMonthIdx] : '없음',
    });

    if (!result.success) {
      reviewStatus = 'error';
      reviewErr    = result.error === 'no_key' ? 'API 키 없음' : result.error;
    } else {
      reviewStatus = 'done';
      reviewHtml   = mdToHtml(result.review);
    }

    renderAiSection();
  }

  loadData();
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
