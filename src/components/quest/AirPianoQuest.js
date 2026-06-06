import './quest.css';
import { load, saveNow } from '../../services/storage.service.js';
import { showToast } from '../../services/toast.service.js';
import { createTimer } from '../../services/timer.service.js';
import { formatTime } from '../../utils/time.utils.js';
import { today } from '../../utils/date.utils.js';

const QUEST_KEY = 'air_quest';
const QUEST_SECS = 3 * 60; // 3분

const STEPS = [
  '평평한 표면(책상, 무릎)에 손을 올려놓는다',
  '1번 손가락부터 5번까지 차례로 눌렀다 뗀다 (10회 반복)',
  '4-5-4-3-2-1 독립 패턴을 느리게 반복한다',
  '양손 교차로 같은 패턴을 연습한다',
];

function getTodayQuestData() {
  const all = load(QUEST_KEY) ?? {};
  return all[today()] ?? { completed: false, completedAt: null };
}

function markQuestDone() {
  const all = load(QUEST_KEY) ?? {};
  all[today()] = { completed: true, completedAt: new Date().toISOString() };
  // 30일 초과 항목 정리
  const keys = Object.keys(all).sort();
  if (keys.length > 30) delete all[keys[0]];
  saveNow(QUEST_KEY, all);
}

/**
 * 공중 피아노 퀘스트 카드.
 * 3분 미니 타이머 + 단계별 운동 안내.
 *
 * @returns {HTMLElement}
 */
export function AirPianoQuest() {
  let questData = getTodayQuestData();
  let timer = null;
  let timerPhase = 'idle'; // 'idle' | 'running' | 'paused' | 'done'

  const el = document.createElement('div');
  el.className = `air-quest${questData.completed ? ' air-quest--done' : ''}`;
  el.setAttribute('aria-label', '오늘의 공중 피아노 퀘스트');

  function render() {
    questData = getTodayQuestData();
    el.className = `air-quest${questData.completed ? ' air-quest--done' : ''}`;

    if (questData.completed) {
      renderDone();
    } else {
      renderActive();
    }
  }

  function renderDone() {
    el.innerHTML = `
      <div class="air-quest__header">
        <span class="air-quest__badge">퀘스트</span>
        <span class="air-quest__title">오늘의 공중 피아노 완료</span>
        <span class="air-quest__done-icon" aria-label="완료">✓</span>
      </div>
    `;
  }

  function renderActive() {
    el.innerHTML = `
      <div class="air-quest__header" style="cursor:pointer" role="button"
           tabindex="0" aria-expanded="false" aria-controls="quest-body"
           aria-label="공중 피아노 퀘스트 펼치기">
        <span class="air-quest__badge">퀘스트</span>
        <span class="air-quest__title">오늘의 공중 피아노 — 3분</span>
      </div>
      <div class="air-quest__body" id="quest-body" hidden>
        <p class="air-quest__desc">
          피아노 앞이 아니어도 됩니다. 지금 있는 자리에서 손가락 독립 훈련을 3분간 해보세요.
        </p>
        <div class="quest-steps" role="list">
          ${STEPS.map(
            (s, i) => `
            <div class="quest-step" role="listitem">
              <span class="quest-step__num" aria-hidden="true">${i + 1}</span>
              <span>${s}</span>
            </div>
          `,
          ).join('')}
        </div>
        <div class="quest-mini-timer">
          <div class="quest-timer__bar" role="progressbar"
               aria-valuemin="0" aria-valuemax="${QUEST_SECS}" aria-valuenow="${QUEST_SECS}">
            <div class="quest-timer__fill" style="width:100%"></div>
          </div>
          <div class="quest-timer__display" aria-live="off">
            ${formatTime(QUEST_SECS)}
          </div>
        </div>
        <button class="quest-btn quest-btn--start" id="quest-action-btn"
                aria-label="공중 피아노 퀘스트 시작">시작</button>
      </div>
    `;

    const header = el.querySelector('.air-quest__header');
    const body = el.querySelector('.air-quest__body');
    const timerBar = el.querySelector('.quest-timer__fill');
    const timerBar2 = el.querySelector('[role="progressbar"]');
    const display = el.querySelector('.quest-timer__display');
    const actionBtn = el.querySelector('#quest-action-btn');

    // 접기/펼치기
    function toggleBody() {
      const open = body.hidden;
      body.hidden = !open;
      header.setAttribute('aria-expanded', String(open));
      header.setAttribute(
        'aria-label',
        open ? '공중 피아노 퀘스트 접기' : '공중 피아노 퀘스트 펼치기',
      );
    }
    header.addEventListener('click', toggleBody);
    header.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggleBody();
      }
    });

    // 타이머 tick 업데이트
    function updateDisplay(remaining) {
      const pct = (remaining / QUEST_SECS) * 100;
      timerBar.style.width = `${pct}%`;
      timerBar2.setAttribute('aria-valuenow', Math.round(remaining));
      display.textContent = formatTime(remaining);
    }

    actionBtn.addEventListener('click', () => {
      if (timerPhase === 'idle' || timerPhase === 'paused') {
        if (timerPhase === 'idle') {
          timer = createTimer({
            duration: QUEST_SECS,
            onTick: (r) => updateDisplay(r),
            onComplete: () => {
              timerPhase = 'done';
              display.textContent = '완료!';
              display.classList.add('quest-timer__display--done');
              actionBtn.textContent = '퀘스트 완료 기록';
              actionBtn.className = 'quest-btn quest-btn--complete';
              actionBtn.setAttribute('aria-label', '퀘스트 완료 기록하기');
            },
          });
        }
        timer.start();
        timerPhase = 'running';
        actionBtn.textContent = '일시정지';
        actionBtn.setAttribute('aria-label', '타이머 일시정지');
      } else if (timerPhase === 'running') {
        timer.pause();
        timerPhase = 'paused';
        actionBtn.textContent = '이어하기';
        actionBtn.setAttribute('aria-label', '타이머 이어하기');
      } else if (timerPhase === 'done') {
        timer?.destroy();
        markQuestDone();
        showToast({
          icon: '🎹',
          title: '공중 피아노 퀘스트 완료!',
          message: '오늘의 손가락 훈련을 마쳤습니다.',
          duration: 4000,
        });
        render();
      }
    });
  }

  el._destroy = () => timer?.destroy();
  render();
  return el;
}
