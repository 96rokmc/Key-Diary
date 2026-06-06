import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  defaults,
} from 'chart.js';
import './charts.css';
import { getSessions } from '../../services/storage.service.js';
import { getStreakData, getPracticedDates } from '../../stores/streak.store.js';

// Chart.js 최소 등록 (트리쉐이킹)
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

// 앱 폰트·색상 기본값
defaults.font.family = "'Noto Serif KR', serif";
defaults.color       = 'rgba(28,23,18,0.55)';

const INDIGO  = '#2d2680';
const CREAM   = '#ede6d3';

function nDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

// 주차별 연습 일수 색상 (0일~7일)
function weekColor(count) {
  if (count === 0) return 'rgba(45,38,128,0.08)';
  if (count <= 2)  return 'rgba(45,38,128,0.35)';
  if (count <= 4)  return 'rgba(45,38,128,0.65)';
  return INDIGO;
}

/**
 * 성장 기록 차트 패널.
 * 통계 카드 4개 + 최근 14일 바 차트 + 최근 4주 바 차트.
 *
 * @returns {HTMLElement}
 */
export function GrowthCharts() {
  const el = document.createElement('div');
  el.className = 'growth-charts';

  const chartInstances = [];

  async function init() {
    const streak   = getStreakData();
    const dates    = getPracticedDates();
    const fromDate = nDaysAgo(13);
    const sessions = await getSessions({ from: fromDate });

    // date → 연습 분 (IndexedDB 세션 기준)
    const minByDate = {};
    sessions.forEach((s) => {
      minByDate[s.date] = (minByDate[s.date] ?? 0) + Math.round(s.duration / 60);
    });

    render(streak, dates, minByDate);
  }

  function render(streak, practicedDates, minByDate) {
    // ── 14일 데이터 ──
    const daily = Array.from({ length: 14 }, (_, i) => {
      const date  = nDaysAgo(13 - i);
      const dow   = ['일', '월', '화', '수', '목', '금', '토'][new Date(date).getDay()];
      const label = i === 13 ? '오늘' : i === 12 ? '어제' : dow;
      // 세션 기록이 없으면 practiced_dates로 30분 폴백
      const mins  = minByDate[date] ?? (practicedDates.has(date) ? 30 : 0);
      return { date, label, mins, practiced: practicedDates.has(date) };
    });

    // ── 4주 데이터 ──
    const weekly = [3, 2, 1, 0].map((w) => {
      const label = w === 0 ? '이번 주' : w === 1 ? '지난주' : `${w + 1}주 전`;
      let count   = 0;
      for (let d = w * 7; d < (w + 1) * 7; d++) {
        if (practicedDates.has(nDaysAgo(d))) count++;
      }
      return { label, count };
    });

    const hasDailyData  = daily.some((d) => d.mins > 0);
    const hasWeeklyData = weekly.some((w) => w.count > 0);

    el.innerHTML = `
      <h3 class="gc-title">성장 기록</h3>

      <div class="gc-stats">
        <div class="gc-stat">
          <span class="gc-stat__value">${streak.currentStreak}</span>
          <span class="gc-stat__label">현재 스트릭</span>
        </div>
        <div class="gc-stat">
          <span class="gc-stat__value">${streak.longestStreak}</span>
          <span class="gc-stat__label">최장 스트릭</span>
        </div>
        <div class="gc-stat">
          <span class="gc-stat__value">${streak.totalDays}</span>
          <span class="gc-stat__label">총 연습일</span>
        </div>
        <div class="gc-stat">
          <span class="gc-stat__value">${formatDuration(streak.totalDuration)}</span>
          <span class="gc-stat__label">누적 시간</span>
        </div>
      </div>

      <div class="gc-chart-card">
        <p class="gc-chart-title">최근 14일 연습 시간 (분)</p>
        ${hasDailyData
          ? `<div class="gc-canvas-wrap"><canvas id="gc-daily" aria-label="최근 14일 연습 시간 막대 그래프" role="img"></canvas></div>`
          : `<p class="gc-empty">아직 기록된 연습이 없습니다</p>`}
      </div>

      <div class="gc-chart-card">
        <p class="gc-chart-title">최근 4주 연습 일수</p>
        ${hasWeeklyData
          ? `<div class="gc-canvas-wrap"><canvas id="gc-weekly" aria-label="최근 4주 연습 일수 막대 그래프" role="img"></canvas></div>`
          : `<p class="gc-empty">아직 기록된 연습이 없습니다</p>`}
      </div>
    `;

    // ── 14일 차트 ──
    const dailyCanvas = el.querySelector('#gc-daily');
    if (dailyCanvas) {
      chartInstances.push(
        new Chart(dailyCanvas, {
          type: 'bar',
          data: {
            labels: daily.map((d) => d.label),
            datasets: [{
              data:            daily.map((d) => d.mins),
              backgroundColor: daily.map((d) => d.practiced ? INDIGO : CREAM),
              borderColor:     daily.map((d) => d.practiced ? '#4038b2' : CREAM),
              borderWidth:     1,
              borderRadius:    3,
            }],
          },
          options: {
            responsive:         true,
            maintainAspectRatio: false,
            plugins: {
              legend:  { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.parsed.y}분`,
                },
              },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { font: { size: 11 } },
              },
              y: {
                min:   0,
                ticks: { stepSize: 15, font: { size: 11 } },
                grid:  { color: 'rgba(28,23,18,0.06)' },
              },
            },
          },
        }),
      );
    }

    // ── 4주 차트 ──
    const weeklyCanvas = el.querySelector('#gc-weekly');
    if (weeklyCanvas) {
      chartInstances.push(
        new Chart(weeklyCanvas, {
          type: 'bar',
          data: {
            labels: weekly.map((w) => w.label),
            datasets: [{
              data:            weekly.map((w) => w.count),
              backgroundColor: weekly.map((w) => weekColor(w.count)),
              borderColor:     weekly.map((w) => weekColor(w.count)),
              borderWidth:     0,
              borderRadius:    4,
            }],
          },
          options: {
            responsive:         true,
            maintainAspectRatio: false,
            plugins: {
              legend:  { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.parsed.y}일 연습`,
                },
              },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { font: { size: 12 } },
              },
              y: {
                min:  0,
                max:  7,
                ticks: {
                  stepSize: 1,
                  font: { size: 11 },
                  callback: (v) => `${v}일`,
                },
                grid: { color: 'rgba(28,23,18,0.06)' },
              },
            },
          },
        }),
      );
    }
  }

  el._destroy = () => {
    chartInstances.forEach((c) => c.destroy());
    chartInstances.length = 0;
  };

  init();
  return el;
}
