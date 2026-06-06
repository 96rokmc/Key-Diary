import './sight-reading.css';
import { load, save } from '../../services/storage.service.js';

const STATS_KEY = 'sight_stats';

// 트레블 클레프 기준 C4~E5 (10개 음)
const QUIZ_NOTES = [
  { key: 'c/4', name: 'C' },
  { key: 'd/4', name: 'D' },
  { key: 'e/4', name: 'E' },
  { key: 'f/4', name: 'F' },
  { key: 'g/4', name: 'G' },
  { key: 'a/4', name: 'A' },
  { key: 'b/4', name: 'B' },
  { key: 'c/5', name: 'C' },
  { key: 'd/5', name: 'D' },
  { key: 'e/5', name: 'E' },
];

const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// CSS 토큰 값 (VexFlow는 문자열 색상만 받으므로 직접 지정)
const INK  = '#1c1712';
const SAGE = '#3a5c48';
const RUST = '#8b3a1e';
const W    = 340;
const H    = 150;

/**
 * 악보 읽기 퀴즈.
 * VexFlow는 훈련 탭 첫 진입 시 동적 import로 lazy-load한다.
 *
 * @returns {HTMLElement}
 */
export function SightReading() {
  let vfMod    = null;
  let current  = null;
  let answered = false;
  let stats    = load(STATS_KEY) ?? { correct: 0, total: 0 };

  const el = document.createElement('div');
  el.className = 'sight-reading';

  function pickNext() {
    const pool = QUIZ_NOTES.filter((n) => n.key !== current?.key);
    current  = pool[Math.floor(Math.random() * pool.length)];
    answered = false;
  }

  // VexFlow를 처음 사용할 때만 동적 import
  async function loadVF() {
    if (!vfMod) vfMod = await import('vexflow');
    return vfMod;
  }

  async function drawNote(color = INK) {
    const staffDiv = el.querySelector('.sr-staff');
    if (!staffDiv) return;

    let vf;
    try {
      vf = await loadVF();
    } catch {
      staffDiv.innerHTML = '<span class="sr-loading">VexFlow 로드 실패</span>';
      return;
    }

    const { Renderer, Stave, StaveNote, Voice, Formatter } = vf;

    staffDiv.innerHTML = '';
    const renderer = new Renderer(staffDiv, Renderer.Backends.SVG);
    renderer.resize(W, H);
    const ctx = renderer.getContext();

    const stave = new Stave(15, 20, W - 30);
    stave.addClef('treble');
    stave.setContext(ctx).draw();

    const note = new StaveNote({ keys: [current.key], duration: 'w' });
    note.setStyle({ fillStyle: color, strokeStyle: color });

    const voice = new Voice({ num_beats: 4, beat_value: 4 });
    voice.addTickables([note]);
    new Formatter().joinVoices([voice]).format([voice], W - 90);
    voice.draw(ctx, stave);

    // SVG를 반응형으로
    const svg = staffDiv.querySelector('svg');
    if (svg) {
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      svg.style.width  = '100%';
      svg.style.height = 'auto';
    }
  }

  function render() {
    const accuracy = stats.total > 0
      ? Math.round((stats.correct / stats.total) * 100)
      : null;

    el.innerHTML = `
      <div class="sr-header">
        <h2 class="sr-title">악보 읽기 훈련</h2>
        <div class="sr-stats">
          <span class="sr-score">${stats.correct}/${stats.total}</span>
          ${accuracy !== null ? `<span class="sr-accuracy">(${accuracy}%)</span>` : ''}
        </div>
      </div>

      <div class="sr-card">
        <p class="sr-question">이 음표의 이름은?</p>
        <div class="sr-staff" role="img" aria-label="악보"></div>
        <div class="sr-feedback" aria-live="assertive" aria-atomic="true"></div>
        <div class="sr-buttons" role="group" aria-label="음표 이름 선택">
          ${NOTE_NAMES.map(
            (n) => `<button class="sr-btn" data-note="${n}" aria-label="${n}음 선택">${n}</button>`,
          ).join('')}
        </div>
      </div>

      ${stats.total >= 10
        ? `<button class="sr-reset" aria-label="통계 초기화">통계 초기화</button>`
        : ''}
    `;

    el.querySelectorAll('.sr-btn').forEach((btn) => {
      btn.addEventListener('click', () => handleAnswer(btn.dataset.note));
    });

    el.querySelector('.sr-reset')?.addEventListener('click', () => {
      stats = { correct: 0, total: 0 };
      save(STATS_KEY, stats);
      render();
    });

    // 악보 그리기 시작 전 로딩 표시
    const staffDiv = el.querySelector('.sr-staff');
    if (staffDiv) {
      staffDiv.innerHTML = '<span class="sr-loading">악보 로딩 중…</span>';
    }
    drawNote();
  }

  async function handleAnswer(name) {
    if (answered) return;
    answered = true;

    const isCorrect = name === current.name;
    stats.total  += 1;
    if (isCorrect) stats.correct += 1;
    save(STATS_KEY, stats);

    // 점수 즉시 반영
    const scoreEl    = el.querySelector('.sr-score');
    const accuracyEl = el.querySelector('.sr-accuracy');
    const accuracy   = Math.round((stats.correct / stats.total) * 100);
    if (scoreEl) scoreEl.textContent = `${stats.correct}/${stats.total}`;
    if (accuracyEl) {
      accuracyEl.textContent = `(${accuracy}%)`;
    } else {
      el.querySelector('.sr-stats')?.insertAdjacentHTML(
        'beforeend',
        `<span class="sr-accuracy">(${accuracy}%)</span>`,
      );
    }

    // 음표 색칠
    await drawNote(isCorrect ? SAGE : RUST);

    // 버튼 결과 표시
    el.querySelectorAll('.sr-btn').forEach((btn) => {
      btn.disabled = true;
      if (btn.dataset.note === current.name) btn.classList.add('sr-btn--correct');
      else if (btn.dataset.note === name)    btn.classList.add('sr-btn--wrong');
    });

    // 피드백 텍스트
    const feedback = el.querySelector('.sr-feedback');
    if (feedback) {
      feedback.textContent = isCorrect
        ? '✓ 정답!'
        : `✗ 틀렸습니다 — 정답: ${current.name}`;
      feedback.className = `sr-feedback sr-feedback--${isCorrect ? 'correct' : 'wrong'}`;
    }

    setTimeout(() => {
      pickNext();
      render();
    }, isCorrect ? 900 : 1600);
  }

  el._destroy = () => {};
  pickNext();
  render();
  return el;
}
