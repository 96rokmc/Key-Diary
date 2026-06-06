import './metronome.css';
import { createMetronome } from '../../services/metronome.service.js';
import { createTapTempo, clampBpm, DEFAULT_BPM } from '../../utils/bpm.utils.js';

const BEATS_PER_MEASURE = 4;

const CHEVRON_SVG = `
  <svg class="metronome__toggle-icon" viewBox="0 0 16 16" fill="none"
       aria-hidden="true" focusable="false">
    <polyline points="4,6 8,10 12,6" stroke="currentColor"
              stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

/**
 * 접을 수 있는 메트로놈 패널.
 * 타이머 하단에 배치해 연습 중 BPM 조절이 가능하다.
 *
 * @returns {HTMLElement}
 */
export function Metronome() {
  let bpm = DEFAULT_BPM;
  let metronome = null;
  let isPlaying = false;
  let activeBeat = -1;
  const tapTempo = createTapTempo();

  // ── DOM ──────────────────────────────────────────────
  const el = document.createElement('div');
  el.className = 'metronome';

  el.innerHTML = `
    <div class="metronome__header" role="button" tabindex="0"
         aria-expanded="false" aria-controls="metronome-body"
         aria-label="메트로놈 펼치기">
      <span class="metronome__title">메트로놈</span>
      ${CHEVRON_SVG}
    </div>

    <div class="metronome__body" id="metronome-body" aria-hidden="true">
      <div class="bpm-control">
        <button class="bpm-btn bpm-btn--large" data-delta="-10"
                aria-label="BPM 10 내리기">−10</button>
        <button class="bpm-btn" data-delta="-1"
                aria-label="BPM 1 내리기">−1</button>

        <div class="bpm-display">
          <span class="bpm-display__value" aria-live="polite" aria-atomic="true"
                aria-label="현재 BPM">${bpm}</span>
          <span class="bpm-display__label">BPM</span>
        </div>

        <button class="bpm-btn" data-delta="+1"
                aria-label="BPM 1 올리기">+1</button>
        <button class="bpm-btn bpm-btn--large" data-delta="+10"
                aria-label="BPM 10 올리기">+10</button>
      </div>

      <div class="beat-dots" role="img" aria-label="박자 인디케이터"></div>

      <div class="metronome__actions">
        <button class="metronome-btn metronome-btn--start" id="kd-metro-toggle"
                aria-label="메트로놈 시작">시작</button>
        <button class="metronome-btn metronome-btn--tap" id="kd-metro-tap"
                aria-label="탭 템포 — 박자에 맞춰 탭하여 BPM 측정">탭 템포</button>
      </div>
    </div>
  `;

  // ── DOM 참조 ─────────────────────────────────────────
  const header = el.querySelector('.metronome__header');
  const body = el.querySelector('.metronome__body');
  const bpmValueEl = el.querySelector('.bpm-display__value');
  const dotsEl = el.querySelector('.beat-dots');
  const toggleBtn = el.querySelector('#kd-metro-toggle');
  const tapBtn = el.querySelector('#kd-metro-tap');

  // ── 비트 도트 생성 ────────────────────────────────────
  const dots = Array.from({ length: BEATS_PER_MEASURE }, (_, i) => {
    const d = document.createElement('div');
    d.className = `beat-dot${i === 0 ? ' beat-dot--accent' : ''}`;
    dotsEl.appendChild(d);
    return d;
  });

  // ── 헬퍼 ─────────────────────────────────────────────
  function updateBpmDisplay() {
    bpmValueEl.textContent = bpm;
  }

  function flashBeat(beat) {
    if (activeBeat >= 0 && activeBeat < dots.length) {
      dots[activeBeat].classList.remove('beat-dot--active');
    }
    activeBeat = beat;
    dots[beat].classList.add('beat-dot--active');
  }

  function resetDots() {
    dots.forEach((d) => d.classList.remove('beat-dot--active'));
    activeBeat = -1;
  }

  // ── 접기/펼치기 ───────────────────────────────────────
  let open = false;

  function togglePanel() {
    open = !open;
    el.classList.toggle('metronome--open', open);
    header.setAttribute('aria-expanded', String(open));
    body.setAttribute('aria-hidden', String(!open));
    header.setAttribute('aria-label', open ? '메트로놈 접기' : '메트로놈 펼치기');
  }

  header.addEventListener('click', togglePanel);
  header.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      togglePanel();
    }
  });

  // ── BPM 버튼 ─────────────────────────────────────────
  el.querySelectorAll('[data-delta]').forEach((btn) => {
    btn.addEventListener('click', () => {
      bpm = clampBpm(bpm + Number(btn.dataset.delta));
      updateBpmDisplay();
      metronome?.setBpm(bpm);
    });
  });

  // ── 시작 / 정지 ──────────────────────────────────────
  toggleBtn.addEventListener('click', () => {
    if (isPlaying) {
      metronome?.stop();
      metronome = null;
      isPlaying = false;
      resetDots();
      toggleBtn.textContent = '시작';
      toggleBtn.className = 'metronome-btn metronome-btn--start';
      toggleBtn.setAttribute('aria-label', '메트로놈 시작');
    } else {
      metronome = createMetronome({
        bpm,
        beatsPerMeasure: BEATS_PER_MEASURE,
        onBeat: (beat) => flashBeat(beat),
      });
      metronome.start();
      isPlaying = true;
      toggleBtn.textContent = '정지';
      toggleBtn.className = 'metronome-btn metronome-btn--stop';
      toggleBtn.setAttribute('aria-label', '메트로놈 정지');
    }
  });

  // ── 탭 템포 ──────────────────────────────────────────
  tapBtn.addEventListener('click', () => {
    const tapped = tapTempo.tap();
    if (tapped !== null) {
      bpm = tapped;
      updateBpmDisplay();
      metronome?.setBpm(bpm);
    }
  });

  // 컴포넌트 언마운트 시 정리 (App.js에서 호출)
  el._destroy = () => {
    metronome?.stop();
    metronome = null;
  };

  return el;
}
