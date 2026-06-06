import './styles/app.css';
import { UI_TEXT } from './constants/ui-text.js';
import { PostureCheck } from './components/posture/PostureCheck.js';
import { PracticeTimer } from './components/timer/PracticeTimer.js';
import { Metronome } from './components/metronome/Metronome.js';
import { StreakCalendar } from './components/calendar/StreakCalendar.js';
import { RepertoireList } from './components/repertoire/RepertoireList.js';
import { SightReading } from './components/sight-reading/SightReading.js';
import { PitchPuzzle } from './components/sight-reading/PitchPuzzle.js';
import { GrowthCharts } from './components/charts/GrowthCharts.js';
import { AirPianoQuest } from './components/quest/AirPianoQuest.js';
import {
  NotificationPrompt,
  NotificationSettings,
} from './components/quest/NotificationPrompt.js';
import { PracticeNotes } from './components/notes/PracticeNotes.js';
import { recordSession } from './stores/streak.store.js';
import { ToastContainer } from './components/toast/Toast.js';
import { checkAndFireReminder } from './services/notification.service.js';

const TABS = /** @type {const} */ ({
  PRACTICE:   'practice',
  REPERTOIRE: 'repertoire',
  TRAINING:   'training',
  CALENDAR:   'calendar',
});

const PRACTICE_VIEWS = /** @type {const} */ ({
  POSTURE: 'posture',
  TIMER:   'timer',
  NOTES:   'notes',
});

export function App() {
  let activeTab        = TABS.PRACTICE;
  let practiceView     = PRACTICE_VIEWS.POSTURE;
  let pendingSessionId = null;
  let pendingDuration  = 0;

  // ── DOM 뼈대 ─────────────────────────────────────────
  const el = document.createElement('div');
  el.id = 'kd-app';

  el.innerHTML = `
    <header class="kd-header">
      <h1 class="kd-header__title text-display">${UI_TEXT.APP_NAME}</h1>
      <p class="kd-header__tagline">${UI_TEXT.APP_TAGLINE}</p>
    </header>
    <main class="kd-main" id="kd-main-content" tabindex="-1"></main>
    <nav class="kd-bottom-nav" aria-label="주요 메뉴">
      <button class="kd-nav-btn kd-nav-btn--active" data-tab="practice"
              aria-label="연습" aria-selected="true">
        <svg class="kd-nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
          <polygon points="10,8.5 10,15.5 16,12" fill="currentColor"/>
        </svg>
        <span>연습</span>
      </button>
      <button class="kd-nav-btn" data-tab="repertoire"
              aria-label="레퍼토리" aria-selected="false">
        <svg class="kd-nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <span>레퍼토리</span>
      </button>
      <button class="kd-nav-btn" data-tab="training"
              aria-label="훈련" aria-selected="false">
        <svg class="kd-nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <line x1="8" y1="8" x2="16" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="8" y1="12" x2="13" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span>훈련</span>
      </button>
      <button class="kd-nav-btn" data-tab="calendar"
              aria-label="캘린더" aria-selected="false">
        <svg class="kd-nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <rect x="3" y="5" width="18" height="17" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="1.5"/>
          <line x1="8" y1="3" x2="8" y2="7" stroke="currentColor" stroke-width="1.5"/>
          <line x1="16" y1="3" x2="16" y2="7" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <span>캘린더</span>
      </button>
    </nav>
  `;

  const main    = el.querySelector('#kd-main-content');
  const navBtns = el.querySelectorAll('.kd-nav-btn');

  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab === activeTab) return;
      switchTab(tab);
    });
  });

  function switchTab(tab) {
    activeTab = tab;
    navBtns.forEach((btn) => {
      const isActive = btn.dataset.tab === tab;
      btn.classList.toggle('kd-nav-btn--active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
    renderMain();
  }

  // ── 렌더 ─────────────────────────────────────────────
  function destroyCurrent() {
    main.querySelectorAll('[data-destroy]').forEach((n) => n._destroy?.());
  }

  function appendIfExists(parent, node) {
    if (node) parent.appendChild(node);
  }

  function goToCalendar() {
    practiceView     = PRACTICE_VIEWS.POSTURE;
    pendingSessionId = null;
    pendingDuration  = 0;
    switchTab(TABS.CALENDAR);
  }

  function renderMain() {
    destroyCurrent();
    main.innerHTML = '';
    main.classList.add('animate-fade-in');
    main.addEventListener('animationend', () => main.classList.remove('animate-fade-in'), {
      once: true,
    });

    // ── 캘린더 탭 ──
    if (activeTab === TABS.CALENDAR) {
      const wrap = document.createElement('div');
      wrap.setAttribute('data-destroy', '');

      const cal = StreakCalendar();
      wrap.appendChild(cal);

      const divider = document.createElement('hr');
      divider.className = 'kd-calendar-divider';
      wrap.appendChild(divider);

      const charts = GrowthCharts();
      charts.setAttribute('data-destroy', '');
      wrap.appendChild(charts);

      main.appendChild(wrap);
      return;
    }

    // ── 레퍼토리 탭 ──
    if (activeTab === TABS.REPERTOIRE) {
      const rep = RepertoireList();
      rep.setAttribute('data-destroy', '');
      main.appendChild(rep);
      return;
    }

    // ── 훈련 탭 ──
    if (activeTab === TABS.TRAINING) {
      const wrap = document.createElement('div');
      wrap.className = 'kd-training-wrapper';
      wrap.setAttribute('data-destroy', '');

      wrap.appendChild(SightReading());

      const divider = document.createElement('hr');
      divider.className = 'kd-training-divider';
      wrap.appendChild(divider);

      wrap.appendChild(PitchPuzzle());
      main.appendChild(wrap);
      return;
    }

    // ── 연습 탭: POSTURE 뷰 ──
    if (practiceView === PRACTICE_VIEWS.POSTURE) {
      const wrapper = document.createElement('div');
      wrapper.className = 'kd-posture-wrapper';

      const notifPrompt   = NotificationPrompt();
      const notifSettings = NotificationSettings();
      appendIfExists(wrapper, notifPrompt);
      appendIfExists(wrapper, notifSettings);
      if (notifSettings) notifSettings.setAttribute('data-destroy', '');

      const quest = AirPianoQuest();
      quest.setAttribute('data-destroy', '');
      wrapper.appendChild(quest);

      wrapper.appendChild(
        PostureCheck({
          onComplete: () => {
            practiceView = PRACTICE_VIEWS.TIMER;
            renderMain();
          },
        }),
      );

      main.appendChild(wrapper);
      return;
    }

    // ── 연습 탭: TIMER 뷰 ──
    if (practiceView === PRACTICE_VIEWS.TIMER) {
      const wrapper = document.createElement('div');
      wrapper.className = 'kd-practice-wrapper';

      const timer = PracticeTimer({
        onComplete: async (duration) => {
          pendingDuration  = duration ?? 0;
          pendingSessionId = await recordSession({ duration: pendingDuration });
          practiceView     = PRACTICE_VIEWS.NOTES;
          renderMain();
        },
      });

      const metro = Metronome();
      metro.setAttribute('data-destroy', '');

      wrapper.appendChild(timer);
      wrapper.appendChild(metro);
      main.appendChild(wrapper);
      return;
    }

    // ── 연습 탭: NOTES 뷰 ──
    main.appendChild(
      PracticeNotes({
        sessionId: pendingSessionId,
        duration:  pendingDuration,
        onSave:    goToCalendar,
        onSkip:    goToCalendar,
      }),
    );
  }

  // ToastContainer: 뷰 전환과 무관하게 앱 루트에 고정
  const toast = ToastContainer();
  toast.setAttribute('data-destroy', '');
  el.appendChild(toast);

  checkAndFireReminder();
  renderMain();
  return el;
}
