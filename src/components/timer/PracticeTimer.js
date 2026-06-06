import './timer.css';
import { PRACTICE_PHASES, TOTAL_SESSION_DURATION } from '../../constants/phases.js';
import { createTimer } from '../../services/timer.service.js';
import { formatTime, formatTimeVerbose } from '../../utils/time.utils.js';

const WARNING_THRESHOLD = 30; // 마지막 30초: 빨간 숫자

/**
 * @param {{ onComplete: () => void }} props
 * @returns {HTMLElement}
 */
export function PracticeTimer({ onComplete }) {
  let phaseIndex = 0;
  let sessionElapsed = 0;
  let timer = null;
  let paused = false;

  // ── DOM 뼈대 ──────────────────────────────────────────
  const el = document.createElement('section');
  el.className = 'practice-timer';
  el.setAttribute('aria-label', '30분 루틴 타이머');

  el.innerHTML = `
    <div class="phase-steps" role="list" aria-label="연습 구간"></div>

    <div class="phase-info">
      <h2 class="phase-info__name"></h2>
      <p class="phase-info__desc"></p>
    </div>

    <div class="countdown" aria-live="off">
      <span class="countdown__sr-label" aria-live="polite" aria-atomic="true"></span>
      <div class="countdown__time" aria-hidden="true"></div>
    </div>

    <div class="phase-progress">
      <div class="phase-progress__bar"
           role="progressbar" aria-valuemin="0"
           aria-valuemax="100" aria-valuenow="0"
           aria-label="구간 진행률">
        <div class="phase-progress__fill"></div>
      </div>
      <div class="phase-progress__labels">
        <span class="phase-elapsed-label">00:00</span>
        <span class="phase-total-label"></span>
      </div>
    </div>

    <div class="timer-controls">
      <button class="timer-btn-primary" id="kd-timer-main-btn" aria-label="연습 시작">
        연습 시작
      </button>
      <button class="timer-btn-secondary" id="kd-timer-skip-btn"
              aria-label="이 구간 건너뛰기" style="visibility:hidden">
        이 구간 건너뛰기
      </button>
    </div>

    <div class="session-summary" aria-label="전체 세션 진행">
      <span>전체</span>
      <span class="session-total-display">00:00 / ${formatTime(TOTAL_SESSION_DURATION)}</span>
    </div>
  `;

  // ── DOM 참조 ──────────────────────────────────────────
  const stepsContainer = el.querySelector('.phase-steps');
  const phaseNameEl = el.querySelector('.phase-info__name');
  const phaseDescEl = el.querySelector('.phase-info__desc');
  const countdownEl = el.querySelector('.countdown__time');
  const srLabelEl = el.querySelector('.countdown__sr-label');
  const progressBar = el.querySelector('[role="progressbar"]');
  const progressFill = el.querySelector('.phase-progress__fill');
  const elapsedLabel = el.querySelector('.phase-elapsed-label');
  const totalLabel = el.querySelector('.phase-total-label');
  const sessionDisplay = el.querySelector('.session-total-display');
  const mainBtn = el.querySelector('#kd-timer-main-btn');
  const skipBtn = el.querySelector('#kd-timer-skip-btn');

  // ── 구간 스텝 생성 ────────────────────────────────────
  PRACTICE_PHASES.forEach((phase, i) => {
    const step = document.createElement('div');
    step.className = 'phase-step';
    step.setAttribute('role', 'listitem');
    step.setAttribute('aria-label', `${i + 1}구간: ${phase.label}`);
    step.dataset.index = i;
    step.innerHTML = `<span class="phase-step__label">${phase.label}</span>`;
    stepsContainer.appendChild(step);
  });

  // ── 렌더링 헬퍼 ──────────────────────────────────────
  function renderPhase(index) {
    const phase = PRACTICE_PHASES[index];
    const color = phase.color;

    // 구간 이름·설명
    phaseNameEl.textContent = phase.label;
    phaseDescEl.textContent = phase.description;

    // 진행 바 색상
    progressFill.style.setProperty('--phase-color', color);
    progressFill.style.background = color;

    // 스텝 인디케이터
    el.querySelectorAll('.phase-step').forEach((step, i) => {
      step.classList.remove('phase-step--active', 'phase-step--done');
      step.style.removeProperty('--step-color');
      if (i < index) step.classList.add('phase-step--done');
      if (i === index) {
        step.classList.add('phase-step--active');
        step.style.setProperty('--step-color', color);
      }
    });

    // 구간 총 시간 라벨
    totalLabel.textContent = formatTime(phase.duration);

    updateCountdown(phase.duration);
    updateProgress(0, phase.duration);
  }

  function updateCountdown(remaining) {
    const text = formatTime(remaining);
    countdownEl.textContent = text;

    const isWarning = remaining <= WARNING_THRESHOLD && remaining > 0;
    countdownEl.classList.toggle('countdown__time--warning', isWarning);

    // 스크린리더: 1분 단위 또는 마지막 10초마다 읽어줌
    const s = Math.floor(remaining);
    if (s % 60 === 0 || s <= 10) {
      srLabelEl.textContent = formatTimeVerbose(remaining);
    }
  }

  function updateProgress(phaseElapsed, phaseDuration) {
    const pct = Math.min(100, (phaseElapsed / phaseDuration) * 100);
    progressFill.style.width = `${pct}%`;
    progressBar.setAttribute('aria-valuenow', Math.round(pct));
    elapsedLabel.textContent = formatTime(phaseElapsed);

    sessionDisplay.textContent = `${formatTime(sessionElapsed)} / ${formatTime(TOTAL_SESSION_DURATION)}`;
  }

  // ── 타이머 진행 ──────────────────────────────────────
  function startPhase(index) {
    phaseIndex = index;
    const phase = PRACTICE_PHASES[index];
    renderPhase(index);

    timer?.destroy();
    timer = createTimer({
      duration: phase.duration,
      onTick(remaining) {
        const phaseElapsed = phase.duration - remaining;
        sessionElapsed = calcSessionElapsed(index, phaseElapsed);
        updateCountdown(remaining);
        updateProgress(phaseElapsed, phase.duration);
      },
      onComplete() {
        sessionElapsed = calcSessionElapsed(index, phase.duration);
        updateProgress(phase.duration, phase.duration);

        const next = index + 1;
        if (next < PRACTICE_PHASES.length) {
          startPhase(next);
        } else {
          showComplete();
        }
      },
    });

    timer.start();
    paused = false;
    mainBtn.textContent = '일시정지';
    mainBtn.setAttribute('aria-label', '일시정지');
    skipBtn.style.visibility = 'visible';
  }

  function calcSessionElapsed(completedUpTo, phaseElapsed) {
    const previousTotal = PRACTICE_PHASES.slice(0, completedUpTo).reduce(
      (sum, p) => sum + p.duration,
      0,
    );
    return previousTotal + phaseElapsed;
  }

  function showComplete() {
    timer?.destroy();

    el.innerHTML = `
      <div class="session-complete animate-slide-up">
        <div class="session-complete__icon" aria-hidden="true">🎹</div>
        <h2 class="session-complete__title">오늘 연습 완료!</h2>
        <p class="session-complete__desc">
          30분 루틴을 모두 마쳤습니다.<br>
          매일 쌓이는 흔적이 연주가 됩니다.
        </p>
        <button class="session-complete__btn" aria-label="오늘의 연습 기록 저장하기">
          기록 저장
        </button>
      </div>
    `;

    el.querySelector('.session-complete__btn').addEventListener('click', () => {
      onComplete(Math.round(sessionElapsed));
    });
  }

  // ── 버튼 이벤트 ──────────────────────────────────────
  mainBtn.addEventListener('click', () => {
    if (!timer) {
      // 첫 시작
      startPhase(0);
      return;
    }
    if (paused) {
      timer.resume();
      paused = false;
      mainBtn.textContent = '일시정지';
      mainBtn.setAttribute('aria-label', '일시정지');
    } else {
      timer.pause();
      paused = true;
      mainBtn.textContent = '이어하기';
      mainBtn.setAttribute('aria-label', '이어하기');
    }
  });

  skipBtn.addEventListener('click', () => {
    const next = phaseIndex + 1;
    if (next < PRACTICE_PHASES.length) {
      sessionElapsed = calcSessionElapsed(
        phaseIndex,
        PRACTICE_PHASES[phaseIndex].duration,
      );
      startPhase(next);
    } else {
      showComplete();
    }
  });

  // ── 초기 렌더 ─────────────────────────────────────────
  renderPhase(0);

  return el;
}
