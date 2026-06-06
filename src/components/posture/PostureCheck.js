import './posture-check.css';
import { POSTURE_ITEMS } from '../../constants/posture.js';
import { UI_TEXT } from '../../constants/ui-text.js';

const CHECKMARK_SVG = `
  <svg class="posture-item__checkmark" viewBox="0 0 14 14" fill="none"
       aria-hidden="true" focusable="false">
    <polyline points="2,7 6,11 12,3" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

/**
 * @param {{ onComplete: () => void }} props
 * @returns {HTMLElement}
 */
export function PostureCheck({ onComplete }) {
  const checked = new Set();

  const el = document.createElement('section');
  el.className = 'posture-check';
  el.setAttribute('aria-label', '연습 전 자세 체크');

  el.innerHTML = `
    <header>
      <h2 class="posture-check__heading">연습 전 자세 체크</h2>
      <p class="posture-check__subheading">
        올바른 자세가 부상을 예방하고 연주 실력을 높입니다.<br>
        세 항목을 모두 확인한 뒤 연습을 시작하세요.
      </p>
    </header>

    <ul class="posture-check__list" role="list"></ul>

    <div class="posture-check__progress" aria-live="polite" aria-atomic="true">
      <div class="posture-check__progress-bar" role="progressbar"
           aria-valuemin="0" aria-valuemax="${POSTURE_ITEMS.length}" aria-valuenow="0">
        <div class="posture-check__progress-fill" style="width: 0%"></div>
      </div>
      <span class="posture-check__progress-text">0 / ${POSTURE_ITEMS.length}</span>
    </div>

    <button class="posture-check__btn" disabled
            aria-disabled="true">
      ${UI_TEXT.START_PRACTICE}
    </button>

    <p class="posture-check__skip">
      <button type="button" aria-label="자세 체크 건너뛰고 바로 시작">
        건너뛰기
      </button>
    </p>
  `;

  const list = el.querySelector('.posture-check__list');
  const progressFill = el.querySelector('.posture-check__progress-fill');
  const progressBar = el.querySelector('[role="progressbar"]');
  const progressText = el.querySelector('.posture-check__progress-text');
  const startBtn = el.querySelector('.posture-check__btn');

  POSTURE_ITEMS.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'posture-item';
    li.setAttribute('role', 'checkbox');
    li.setAttribute('aria-checked', 'false');
    li.setAttribute('tabindex', '0');
    li.setAttribute('aria-label', item.label);
    li.dataset.id = item.id;

    li.innerHTML = `
      <div class="posture-item__checkbox" aria-hidden="true">
        ${CHECKMARK_SVG}
      </div>
      <div class="posture-item__content">
        <span class="posture-item__label">${item.label}</span>
        <span class="posture-item__description">${item.description}</span>
        <span class="posture-item__tip">${item.tip}</span>
      </div>
    `;

    li.addEventListener('click', () => toggle(item.id, li));
    li.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggle(item.id, li);
      }
    });

    list.appendChild(li);
  });

  el.querySelector('.posture-check__skip button').addEventListener('click', () => {
    onComplete();
  });

  startBtn.addEventListener('click', () => {
    if (checked.size === POSTURE_ITEMS.length) onComplete();
  });

  function toggle(id, li) {
    if (checked.has(id)) {
      checked.delete(id);
      li.classList.remove('posture-item--checked');
      li.setAttribute('aria-checked', 'false');
    } else {
      checked.add(id);
      li.classList.add('posture-item--checked');
      li.setAttribute('aria-checked', 'true');
      li.classList.add('animate-pop');
      li.addEventListener('animationend', () => li.classList.remove('animate-pop'), {
        once: true,
      });
    }
    updateProgress();
  }

  function updateProgress() {
    const count = checked.size;
    const total = POSTURE_ITEMS.length;
    const pct = Math.round((count / total) * 100);

    progressFill.style.width = `${pct}%`;
    progressBar.setAttribute('aria-valuenow', count);
    progressText.textContent = `${count} / ${total}`;

    const allDone = count === total;
    startBtn.disabled = !allDone;
    startBtn.setAttribute('aria-disabled', String(!allDone));
  }

  return el;
}
