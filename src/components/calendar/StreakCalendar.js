import './calendar.css';
import {
  getStreakData,
  getPracticedDates,
  subscribe,
} from '../../stores/streak.store.js';
import { BADGES } from '../../constants/badges.js';
import {
  today,
  toDateStr,
  formatYearMonth,
  formatDuration,
  getDaysInMonth,
  getFirstDayOfWeek,
  prevMonth,
  nextMonth,
  isToday,
} from '../../utils/date.utils.js';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const CHEVRON_LEFT = `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" width="16" height="16"><polyline points="10,4 6,8 10,12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CHEVRON_RIGHT = `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false" width="16" height="16"><polyline points="6,4 10,8 6,12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** @returns {HTMLElement} */
export function StreakCalendar() {
  const todayStr = today();
  const todayDate = new Date(todayStr);
  let viewYear = todayDate.getFullYear();
  let viewMonth = todayDate.getMonth() + 1; // 1-based

  // ── DOM ──────────────────────────────────────────────
  const el = document.createElement('section');
  el.className = 'streak-calendar';
  el.setAttribute('aria-label', '연습 스트릭 캘린더');

  el.innerHTML = `
    <div class="cal-header">
      <button class="cal-nav-btn" id="cal-prev" aria-label="이전 달">${CHEVRON_LEFT}</button>
      <h2 class="cal-month-label" aria-live="polite" aria-atomic="true"></h2>
      <button class="cal-nav-btn" id="cal-next" aria-label="다음 달">${CHEVRON_RIGHT}</button>
    </div>

    <div>
      <div class="cal-weekdays" role="row">
        ${WEEKDAYS.map(
          (d, i) =>
            `<div class="cal-weekday${i === 0 ? ' cal-weekday--sun' : ''}" role="columnheader">${d}</div>`,
        ).join('')}
      </div>
      <div class="cal-grid" role="grid" aria-label="월간 연습 현황"></div>
    </div>

    <div class="streak-stats" aria-label="연습 통계"></div>

    <p class="streak-today-hint" id="cal-today-hint" hidden></p>

    <section class="badge-section" aria-label="획득 배지">
      <h3 class="badge-section__heading">배지</h3>
      <div class="badge-grid"></div>
    </section>
  `;

  // ── DOM 참조 ─────────────────────────────────────────
  const monthLabel = el.querySelector('.cal-month-label');
  const grid = el.querySelector('.cal-grid');
  const statsEl = el.querySelector('.streak-stats');
  const todayHint = el.querySelector('#cal-today-hint');
  const badgeGrid = el.querySelector('.badge-grid');
  const prevBtn = el.querySelector('#cal-prev');
  const nextBtn = el.querySelector('#cal-next');

  // ── 렌더 ─────────────────────────────────────────────
  function render() {
    const practicedDates = getPracticedDates();
    const streak = getStreakData();

    renderHeader();
    renderGrid(practicedDates);
    renderStats(streak, practicedDates);
    renderTodayHint(practicedDates);
    renderBadges(streak);
  }

  function renderHeader() {
    monthLabel.textContent = formatYearMonth(viewYear, viewMonth);

    // 미래 달은 이동 불가
    const { year: ny, month: nm } = nextMonth(viewYear, viewMonth);
    const now = new Date();
    nextBtn.disabled =
      ny > now.getFullYear() || (ny === now.getFullYear() && nm > now.getMonth() + 1);
  }

  function renderGrid(practicedDates) {
    grid.innerHTML = '';

    const days = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

    // 이전 달 빈 셀
    for (let i = 0; i < firstDay; i++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day cal-day--other-month';
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-hidden', 'true');
      grid.appendChild(cell);
    }

    // 이번 달 날짜
    for (let d = 1; d <= days; d++) {
      const dateStr = toDateStr(new Date(viewYear, viewMonth - 1, d));
      const practiced = practicedDates.has(dateStr);
      const todayDay = isToday(dateStr);

      const cell = document.createElement('div');
      const classes = ['cal-day', 'cal-day--current-month'];
      if (practiced) classes.push('cal-day--practiced');
      if (todayDay) classes.push('cal-day--today');
      cell.className = classes.join(' ');
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute(
        'aria-label',
        `${viewMonth}월 ${d}일${practiced ? ' — 연습함' : ''}${todayDay ? ' (오늘)' : ''}`,
      );
      cell.textContent = d;
      grid.appendChild(cell);
    }
  }

  function renderStats(streak, practicedDates) {
    const totalH = formatDuration(streak.totalDuration);
    const practicedThisMonth = countPracticedInMonth(practicedDates, viewYear, viewMonth);

    statsEl.innerHTML = `
      <div class="stat-card stat-card--accent">
        <span class="stat-card__value">${streak.currentStreak}</span>
        <span class="stat-card__label">현재 스트릭 (일)</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__value">${streak.longestStreak}</span>
        <span class="stat-card__label">최장 스트릭 (일)</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__value">${streak.totalDays}</span>
        <span class="stat-card__label">총 연습일</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__value">${practicedThisMonth}</span>
        <span class="stat-card__label">이번 달 연습일</span>
      </div>
      <div class="stat-card" style="grid-column: span 2">
        <span class="stat-card__value">${totalH}</span>
        <span class="stat-card__label">누적 연습 시간</span>
      </div>
    `;
  }

  function renderTodayHint(practicedDates) {
    const isCurrentMonth =
      viewYear === todayDate.getFullYear() && viewMonth === todayDate.getMonth() + 1;

    if (!isCurrentMonth) {
      todayHint.hidden = true;
      return;
    }

    if (practicedDates.has(todayStr)) {
      todayHint.hidden = true;
    } else {
      todayHint.hidden = false;
      todayHint.innerHTML = `오늘은 아직 연습 기록이 없어요.<br><strong>연습 탭</strong>에서 오늘의 루틴을 시작해보세요.`;
    }
  }

  function renderBadges(streak) {
    const earnedMap = new Map(streak.badges.map((b) => [b.id, b.earnedAt]));
    badgeGrid.innerHTML = '';

    BADGES.forEach((badge) => {
      const earnedAt = earnedMap.get(badge.id);
      const earned = Boolean(earnedAt);

      const item = document.createElement('div');
      item.className = `badge-item${earned ? ' badge-item--earned' : ''}`;
      item.setAttribute('role', 'img');
      item.setAttribute(
        'aria-label',
        earned
          ? `${badge.label} — ${badge.description} (${earnedAt} 달성)`
          : `${badge.label} — 미달성: ${badge.description}`,
      );

      item.innerHTML = `
        <span class="badge-item__icon" aria-hidden="true">${badge.icon}</span>
        <span class="badge-item__label">${badge.label}</span>
        ${earned ? `<span class="badge-item__date">${earnedAt}</span>` : ''}
      `;

      badgeGrid.appendChild(item);
    });
  }

  function countPracticedInMonth(practicedDates, year, month) {
    const prefix = `${year}-${String(month).padStart(2, '0')}-`;
    return [...practicedDates].filter((d) => d.startsWith(prefix)).length;
  }

  // ── 네비게이션 ────────────────────────────────────────
  prevBtn.addEventListener('click', () => {
    ({ year: viewYear, month: viewMonth } = prevMonth(viewYear, viewMonth));
    render();
  });

  nextBtn.addEventListener('click', () => {
    ({ year: viewYear, month: viewMonth } = nextMonth(viewYear, viewMonth));
    render();
  });

  // 스트릭 스토어 변경 시 리렌더
  const unsubscribe = subscribe(() => render());
  el._destroy = unsubscribe;

  render();
  return el;
}
