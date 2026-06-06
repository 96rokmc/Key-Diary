import './styles/app.css';
import { UI_TEXT } from './constants/ui-text.js';
import { PostureCheck } from './components/posture/PostureCheck.js';
import { PracticeTimer } from './components/timer/PracticeTimer.js';
import { Metronome } from './components/metronome/Metronome.js';
import { StreakCalendar } from './components/calendar/StreakCalendar.js';
import { AirPianoQuest } from './components/quest/AirPianoQuest.js';
import {
  NotificationPrompt,
  NotificationSettings,
} from './components/quest/NotificationPrompt.js';
import { recordSession } from './stores/streak.store.js';
import { ToastContainer } from './components/toast/Toast.js';
import { checkAndFireReminder } from './services/notification.service.js';

const TABS = /** @type {const} */ ({ PRACTICE: 'practice', CALENDAR: 'calendar' });
const PRACTICE_VIEWS = /** @type {const} */ ({ POSTURE: 'posture', TIMER: 'timer' });

export function App() {
  let activeTab = TABS.PRACTICE;
  let practiceView = PRACTICE_VIEWS.POSTURE;

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

  const main = el.querySelector('#kd-main-content');
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

  function renderMain() {
    destroyCurrent();
    main.innerHTML = '';
    main.classList.add('animate-fade-in');
    main.addEventListener(
      'animationend',
      () => main.classList.remove('animate-fade-in'),
      {
        once: true,
      },
    );

    if (activeTab === TABS.CALENDAR) {
      const cal = StreakCalendar();
      cal.setAttribute('data-destroy', '');
      main.appendChild(cal);
      return;
    }

    // ── 연습 탭: POSTURE 뷰 ──
    if (practiceView === PRACTICE_VIEWS.POSTURE) {
      const wrapper = document.createElement('div');
      wrapper.className = 'kd-posture-wrapper';

      // 1. 알림 설정 배너 (미설정 시) 또는 알림 시각 설정
      const notifPrompt = NotificationPrompt();
      const notifSettings = NotificationSettings();
      appendIfExists(wrapper, notifPrompt);
      appendIfExists(wrapper, notifSettings);
      if (notifSettings) notifSettings.setAttribute('data-destroy', '');

      // 2. 공중 피아노 퀘스트
      const quest = AirPianoQuest();
      quest.setAttribute('data-destroy', '');
      wrapper.appendChild(quest);

      // 3. 자세 체크
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
    const wrapper = document.createElement('div');
    wrapper.className = 'kd-practice-wrapper';

    const timer = PracticeTimer({
      onComplete: (duration) => {
        recordSession({ duration: duration ?? 0 });
        practiceView = PRACTICE_VIEWS.POSTURE;
        switchTab(TABS.CALENDAR);
      },
    });

    const metro = Metronome();
    metro.setAttribute('data-destroy', '');

    wrapper.appendChild(timer);
    wrapper.appendChild(metro);
    main.appendChild(wrapper);
  }

  // ToastContainer: 뷰 전환과 무관하게 앱 루트에 고정
  const toast = ToastContainer();
  toast.setAttribute('data-destroy', '');
  el.appendChild(toast);

  // 앱 로드 시 오늘의 알림 발송 여부 체크
  checkAndFireReminder();

  renderMain();
  return el;
}
