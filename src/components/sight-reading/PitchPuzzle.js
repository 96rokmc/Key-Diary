import './pitch-puzzle.css';
import { load, save } from '../../services/storage.service.js';

const STATS_KEY = 'pitch_puzzle_stats';

// ── 건반 상수 ─────────────────────────────────────────────
const WKW  = 28;   // white key width
const WKH  = 88;   // white key height
const BKW  = 17;   // black key width
const BKH  = 54;   // black key height

// 반음(semitone) → 옥타브 내 흰 건반 인덱스
const WHITE_IDX   = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 };
// 반음 → 흰 건반 기준 x 비율 (중간 위치)
const BLACK_FRAC  = { 1: 0.67, 3: 1.67, 6: 3.67, 8: 4.67, 10: 5.67 };

const NOTE_NAMES  = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const START_MIDI  = 60;  // C4
const END_MIDI    = 84;  // C6
const START_OCT   = 4;
const PIANO_W     = 15 * WKW;  // C4~C6: 흰 건반 15개

// 색상 (CSS 변수를 VexFlow처럼 직접 사용)
const C_INK    = '#1c1712';
const C_IVORY  = '#faf7f2';
const C_INDIGO = '#2d2680';
const C_SAGE   = '#3a5c48';
const C_RUST   = '#8b3a1e';

const QUESTION_TYPES = [
  { steps: 1, dir: 'above', label: '반음 위' },
  { steps: 2, dir: 'above', label: '온음 위' },
  { steps: 1, dir: 'below', label: '반음 아래' },
  { steps: 2, dir: 'below', label: '온음 아래' },
];

// ── 유틸 ─────────────────────────────────────────────────
function noteName(midi) { return NOTE_NAMES[midi % 12]; }
function isWhite(midi)  { return (midi % 12) in WHITE_IDX; }

function keyX(midi) {
  const s = midi % 12;
  const octaveX = (Math.floor(midi / 12) - 1 - START_OCT) * 7 * WKW;
  if (isWhite(midi)) return octaveX + WHITE_IDX[s] * WKW;
  return Math.round(octaveX + BLACK_FRAC[s] * WKW - BKW / 2);
}

/**
 * 온음/반음 퍼즐 — 피아노 건반 클릭으로 음정 맞추기.
 * @returns {HTMLElement}
 */
export function PitchPuzzle() {
  let q        = null;   // { noteMidi, answerMidi, steps, dir, label }
  let answered = false;
  const stats  = load(STATS_KEY) ?? { correct: 0, total: 0 };

  const el = document.createElement('div');
  el.className = 'pitch-puzzle';

  // ── 문제 생성 ─────────────────────────────────────────
  function nextQuestion() {
    const qType  = QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)];
    const minM   = qType.dir === 'below' ? START_MIDI + qType.steps : START_MIDI;
    const maxM   = qType.dir === 'above' ? END_MIDI   - qType.steps : END_MIDI;

    // 시작음은 흰 건반만 (이름이 명확해 설명하기 쉬움)
    const pool = [];
    for (let m = minM; m <= maxM; m++) {
      if (isWhite(m) && (!q || m !== q.noteMidi)) pool.push(m);
    }
    const noteMidi   = pool[Math.floor(Math.random() * pool.length)];
    const answerMidi = qType.dir === 'above'
      ? noteMidi + qType.steps
      : noteMidi - qType.steps;

    q        = { noteMidi, answerMidi, ...qType };
    answered = false;
  }

  // ── SVG 건반 렌더 ────────────────────────────────────
  function pianoSVG(correctMidi = null, wrongMidi = null) {
    let whites = '';
    let blacks  = '';

    for (let midi = START_MIDI; midi <= END_MIDI; midi++) {
      const x     = keyX(midi);
      const white = isWhite(midi);

      let fill;
      if      (midi === correctMidi)   fill = C_SAGE;
      else if (midi === wrongMidi)     fill = C_RUST;
      else if (midi === q.noteMidi)    fill = C_INDIGO;
      else                             fill = white ? C_IVORY : C_INK;

      const dimmed = (correctMidi || wrongMidi)
        && midi !== correctMidi
        && midi !== wrongMidi
        && midi !== q.noteMidi;
      const opacity = dimmed ? '0.3' : '1';
      const cursor  = answered ? 'default' : 'pointer';

      const base = `fill="${fill}" stroke="${C_INK}" stroke-width="1"
                    opacity="${opacity}" style="cursor:${cursor}"
                    data-midi="${midi}" class="pk"`;

      if (white) {
        whites += `<rect x="${x}" y="0" width="${WKW - 1}" height="${WKH}" rx="2" ${base}/>`;
      } else {
        blacks  += `<rect x="${x}" y="0" width="${BKW}"     height="${BKH}" rx="1" ${base}/>`;
      }
    }

    // C4, C5, C6 옥타브 표시
    const labels = [60, 72, 84].map((midi) => {
      const x  = keyX(midi);
      const oct = Math.floor(midi / 12) - 1;
      return `<text x="${x + 2}" y="${WKH - 5}" font-size="8"
                    fill="${C_INK}" opacity="0.4" font-family="monospace">C${oct}</text>`;
    }).join('');

    return `
      <svg class="piano-svg" viewBox="0 0 ${PIANO_W} ${WKH + 2}"
           style="width:${PIANO_W}px;height:auto"
           role="group" aria-label="피아노 건반 — 정답 건반을 클릭하세요">
        ${whites}${blacks}${labels}
      </svg>`;
  }

  // ── 렌더 ─────────────────────────────────────────────
  function render(correctMidi = null, wrongMidi = null) {
    const accuracy = stats.total > 0
      ? Math.round((stats.correct / stats.total) * 100)
      : null;

    el.innerHTML = `
      <div class="pp-header">
        <h2 class="pp-title">온음/반음 퍼즐</h2>
        <div class="pp-stats">
          <span class="pp-score">${stats.correct}/${stats.total}</span>
          ${accuracy !== null ? `<span class="pp-accuracy">(${accuracy}%)</span>` : ''}
        </div>
      </div>

      <div class="pp-card">
        <p class="pp-question">
          <strong>${noteName(q.noteMidi)}</strong>에서
          <strong>${q.label}</strong>의 음은?
        </p>
        <div class="pp-piano-wrap">
          ${pianoSVG(correctMidi, wrongMidi)}
        </div>
        <div class="pp-feedback" aria-live="assertive" aria-atomic="true"></div>
        <p class="pp-hint">파란 건반이 기준음 — 정답 건반을 클릭하세요</p>
      </div>
    `;

    if (!answered) {
      el.querySelectorAll('.pk').forEach((key) => {
        key.addEventListener('click', () => handleAnswer(Number(key.dataset.midi)));
      });
    }
  }

  // ── 답 처리 ───────────────────────────────────────────
  function handleAnswer(midi) {
    if (answered) return;
    answered = true;

    const isCorrect = midi === q.answerMidi;
    stats.total  += 1;
    if (isCorrect) stats.correct += 1;
    save(STATS_KEY, stats);

    render(
      isCorrect ? midi : q.answerMidi,
      isCorrect ? null : midi,
    );

    // 점수 즉시 갱신
    const scoreEl = el.querySelector('.pp-score');
    const accEl   = el.querySelector('.pp-accuracy');
    if (scoreEl) scoreEl.textContent = `${stats.correct}/${stats.total}`;
    if (accEl) {
      accEl.textContent = `(${Math.round((stats.correct / stats.total) * 100)}%)`;
    } else {
      el.querySelector('.pp-stats')?.insertAdjacentHTML(
        'beforeend',
        `<span class="pp-accuracy">(${Math.round((stats.correct / stats.total) * 100)}%)</span>`,
      );
    }

    const feedback = el.querySelector('.pp-feedback');
    if (feedback) {
      feedback.textContent = isCorrect
        ? `✓ 정답! ${noteName(q.answerMidi)}`
        : `✗ 틀렸습니다 — 정답: ${noteName(q.answerMidi)}`;
      feedback.className = `pp-feedback pp-feedback--${isCorrect ? 'correct' : 'wrong'}`;
    }

    setTimeout(() => {
      nextQuestion();
      render();
    }, isCorrect ? 900 : 1600);
  }

  el._destroy = () => {};
  nextQuestion();
  render();
  return el;
}
