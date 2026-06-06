import './overtraining.css';
import { UI_TEXT } from '../../constants/ui-text.js';
import { getTodayRisk } from '../../services/overtraining.service.js';

/**
 * 타이머 뷰 상단에 붙는 오버트레이닝 경고 배너.
 * 위험 없으면 빈 div — 레이아웃에 영향 없음.
 *
 * @returns {HTMLElement}
 */
export function OvertrainingBanner() {
  const el = document.createElement('div');
  el.className = 'ot-banner-wrap';

  async function init() {
    const risk = await getTodayRisk();
    const items = [];

    if (risk.isOverloaded) {
      items.push({ level: 'danger', text: UI_TEXT.OVERTRAINING_LIMIT(risk.totalMins) });
    } else if (risk.isWarning) {
      items.push({ level: 'warn',   text: UI_TEXT.OVERTRAINING_WARN(risk.totalMins) });
    }

    if (risk.isStreakRisk) {
      items.push({ level: 'info',   text: UI_TEXT.OVERTRAINING_STREAK(risk.currentStreak) });
    }

    if (items.length === 0) return;

    const ICONS = { danger: '⚠️', warn: '🙌', info: 'ℹ️' };

    el.innerHTML = items
      .map(
        ({ level, text }) => `
          <div class="ot-banner ot-banner--${level}" role="alert">
            <span class="ot-icon" aria-hidden="true">${ICONS[level]}</span>
            <p class="ot-text">${text}</p>
          </div>`,
      )
      .join('');
  }

  init();
  return el;
}
