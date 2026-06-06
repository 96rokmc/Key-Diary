# 건반일기 (Keys Diary) — Engineering Guide
> Claude Code 작업 시 이 파일을 항상 먼저 읽는다.
> 모든 코드 생성·수정은 이 가이드의 원칙을 따른다.

---

## 0. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **앱 이름** | 건반일기 (Keys Diary) |
| **목적** | 50대 성인 피아노 독학자의 꾸준한 연습 습관 형성 및 실력 향상 |
| **핵심 철학** | "기록이 동기부여다 — 매일 앉은 흔적이 쌓여 연주가 된다" |
| **포지셔닝** | Flowkey 등 곡 학습 앱의 파트너 — 연습 루틴 코치 + 습관 일지 |
| **목표 플랫폼** | 웹 앱 (PWA) — 태블릿·PC 우선, 스마트폰 지원 |
| **최종 목표** | 베토벤 비창 2악장 완주 (1년 로드맵) |

---

## 1. 기술 스택

### 1-1. 프론트엔드
```
├── Framework   : Vanilla JS (1단계) → React 18 (2단계 이후)
├── Bundler     : Vite 5
├── Styling     : CSS Custom Properties + CSS Modules
├── 악보/음악   : Tone.js (메트로놈·오디오), VexFlow (악보 렌더링)
├── 차트        : Chart.js 4
├── PWA         : Vite PWA Plugin (vite-plugin-pwa)
└── 폰트        : Google Fonts (Noto Serif KR, Instrument Serif, DM Mono)
```

### 1-2. 데이터 저장
```
├── 1단계  : localStorage  (단순 키-값, 설정·스트릭)
├── 2단계  : IndexedDB     (연습 기록·레퍼토리·노트, idb 라이브러리 사용)
└── 3단계  : Supabase      (녹음 파일·AI 리뷰 클라우드 저장)
```

### 1-3. AI 연동 (3단계)
```
└── Claude API  : claude-sonnet-4-20250514
                  /v1/messages, max_tokens: 1000
                  연습 기록 → AI 리뷰·내일 계획 생성
```

### 1-4. 개발 도구
```
├── 패키지 관리  : npm
├── 린팅        : ESLint + Prettier
├── 타입 체크   : JSDoc + VS Code IntelliSense (TypeScript는 2단계 도입)
├── 버전 관리   : Git (커밋 컨벤션 아래 참고)
└── 배포        : GitHub Pages (1단계) → Netlify (2단계 이후)
```

---

## 2. 디렉터리 구조

```
keonban-ilgi/
├── CLAUDE.md                  ← 이 파일 (항상 먼저 읽기)
├── README.md
├── package.json
├── vite.config.js
├── .eslintrc.cjs
├── .prettierrc
│
├── public/
│   ├── favicon.ico
│   ├── icon-192.png           ← PWA 아이콘
│   ├── icon-512.png
│   └── manifest.json          ← PWA 매니페스트
│
├── src/
│   ├── main.js                ← 앱 진입점
│   ├── App.js                 ← 루트 컴포넌트
│   │
│   ├── components/            ← UI 컴포넌트 (기능별)
│   │   ├── posture/           ← 자세 체크리스트
│   │   ├── timer/             ← 30분 루틴 타이머
│   │   ├── metronome/         ← 메트로놈
│   │   ├── calendar/          ← 스트릭 캘린더
│   │   ├── repertoire/        ← 레퍼토리 관리
│   │   ├── notes/             ← 연습 노트
│   │   ├── charts/            ← 성장 그래프
│   │   └── ai-coach/          ← AI 연습 코치 (3단계)
│   │
│   ├── stores/                ← 상태 관리 (Vanilla: 모듈, React: Zustand)
│   │   ├── practice.store.js  ← 연습 세션 상태
│   │   ├── streak.store.js    ← 스트릭·캘린더 상태
│   │   └── settings.store.js  ← 사용자 설정
│   │
│   ├── services/              ← 비즈니스 로직 (UI와 분리)
│   │   ├── storage.service.js ← localStorage / IndexedDB 추상화
│   │   ├── metronome.service.js ← Web Audio API 래퍼
│   │   ├── notification.service.js ← 푸시 알림
│   │   └── ai.service.js      ← Claude API 호출 (3단계)
│   │
│   ├── utils/                 ← 순수 유틸 함수
│   │   ├── date.utils.js      ← 날짜 포맷·계산
│   │   ├── time.utils.js      ← 시간 포맷 (00:00)
│   │   └── bpm.utils.js       ← BPM 계산·검증
│   │
│   ├── styles/                ← 전역 스타일
│   │   ├── tokens.css         ← CSS 커스텀 프로퍼티 (디자인 토큰)
│   │   ├── reset.css          ← CSS 리셋
│   │   ├── typography.css     ← 타이포그래피
│   │   └── animations.css     ← 공통 애니메이션
│   │
│   └── constants/             ← 앱 전역 상수
│       ├── phases.js          ← 연습 구간 정의
│       ├── repertoire.js      ← 기본 레퍼토리 데이터
│       └── badges.js          ← 배지 조건 정의
│
└── tests/
    ├── utils/
    └── services/
```

---

## 3. 디자인 토큰 (CSS Custom Properties)

> **모든 색상·폰트·간격은 반드시 토큰을 사용한다. 하드코딩 금지.**

```css
/* src/styles/tokens.css */

:root {
  /* ── Color ── */
  --color-ink:        #1c1712;   /* 본문 텍스트 */
  --color-paper:      #f7f2e9;   /* 배경 */
  --color-cream:      #ede6d3;   /* 보조 배경 */
  --color-ivory:      #faf7f2;   /* 카드 배경 */

  --color-indigo:     #2d2680;   /* 주색 (1단계) */
  --color-indigo-2:   #4038b2;   /* 주색 밝게 */
  --color-gold:       #b8862a;   /* 강조색 */
  --color-gold-2:     #d4a84b;   /* 강조색 밝게 */
  --color-sage:       #3a5c48;   /* 성공·완료 */
  --color-rust:       #8b3a1e;   /* 경고·오류 */

  /* Phase 색상 */
  --color-phase-1:    #2d2680;   /* 1단계 — 인디고 */
  --color-phase-2:    #0e6e55;   /* 2단계 — 포레스트 */
  --color-phase-3:    #9b2c0e;   /* 3단계 — 번트 시에나 */

  --color-muted:      rgba(28, 23, 18, 0.45);
  --color-border:     rgba(28, 23, 18, 0.12);
  --color-border-strong: rgba(28, 23, 18, 0.25);

  /* ── Typography ── */
  --font-serif:    'Noto Serif KR', serif;
  --font-display:  'Instrument Serif', serif;
  --font-mono:     'DM Mono', monospace;

  --text-xs:   0.75rem;    /* 12px */
  --text-sm:   0.875rem;   /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg:   1.125rem;   /* 18px */
  --text-xl:   1.25rem;    /* 20px */
  --text-2xl:  1.5rem;     /* 24px */
  --text-3xl:  1.875rem;   /* 30px */

  --leading-tight:  1.2;
  --leading-normal: 1.6;
  --leading-loose:  1.8;

  --tracking-tight:  -0.02em;
  --tracking-normal:  0;
  --tracking-wide:    0.08em;
  --tracking-widest:  0.18em;

  /* ── Spacing ── */
  --space-1:  0.25rem;   /*  4px */
  --space-2:  0.5rem;    /*  8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;   /* 20px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */

  /* ── Border Radius ── */
  --radius-sm:   2px;
  --radius-md:   4px;
  --radius-lg:   8px;
  --radius-xl:   16px;
  --radius-full: 9999px;

  /* ── Shadow ── */
  --shadow-sm:  0 1px 3px rgba(28,23,18,0.06);
  --shadow-md:  0 4px 12px rgba(28,23,18,0.09);
  --shadow-lg:  0 12px 32px rgba(28,23,18,0.12);

  /* ── Transition ── */
  --ease-default: 0.2s ease;
  --ease-slow:    0.4s ease;
  --ease-spring:  0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ── Z-index ── */
  --z-base:    0;
  --z-raised:  10;
  --z-overlay: 100;
  --z-modal:   200;
  --z-toast:   300;
}
```

---

## 4. 코드 컨벤션

### 4-1. 파일 네이밍
```
컴포넌트       : PascalCase.js         (PostureCheck.js)
유틸·서비스    : camelCase.service.js   (storage.service.js)
스타일         : kebab-case.css         (posture-check.css)
상수           : camelCase.js           (phases.js)
테스트         : *.test.js              (date.utils.test.js)
```

### 4-2. 함수·변수 네이밍
```javascript
// ✅ 좋은 예
const practiceSessionDuration = 1800;       // 명확한 의미
const isStreakActive = checkStreak(today);   // is/has Boolean
function startPracticeTimer(phaseIndex) {}  // 동사로 시작
function formatTime(seconds) {}             // 명확한 역할

// ❌ 나쁜 예
const d = 1800;
const flag = true;
function handle() {}
function doStuff(x) {}
```

### 4-3. 상수 정의
```javascript
// src/constants/phases.js
// 연습 구간은 반드시 이 상수를 참조 — 하드코딩 금지
export const PRACTICE_PHASES = [
  {
    id: 'warmup',
    label: '워밍업',
    duration: 300,          // 초 단위
    color: 'var(--color-phase-1)',
    description: '손가락 스트레칭 + C장조 스케일',
  },
  {
    id: 'technique',
    label: '테크닉 훈련',
    duration: 600,
    color: 'var(--color-phase-1)',
    description: '손가락 독립 패턴 퀘스트',
  },
  {
    id: 'repertoire',
    label: '목표 곡 연습',
    duration: 600,
    color: 'var(--color-phase-2)',
    description: '비창 2악장 — 오늘 마디 집중',
  },
  {
    id: 'review',
    label: '복습 마무리',
    duration: 300,
    color: 'var(--color-phase-2)',
    description: '느린 템포 전체 복습 + 자기 평가',
  },
];

export const TOTAL_SESSION_DURATION = PRACTICE_PHASES
  .reduce((sum, p) => sum + p.duration, 0); // 1800초 = 30분
```

### 4-4. 에러 처리
```javascript
// 서비스 레이어: 항상 try-catch + 의미 있는 에러 메시지
async function saveSessionRecord(record) {
  try {
    await storageService.set('session', record);
    return { success: true, data: record };
  } catch (error) {
    console.error('[storage] 세션 저장 실패:', error);
    return { success: false, error: error.message };
  }
}

// UI 레이어: 사용자에게 보이는 에러는 한국어
function showError(message) {
  toast.show({ type: 'error', message });
}
```

### 4-5. 주석 원칙
```javascript
// ✅ WHY를 설명하는 주석
// 메트로놈은 AudioContext가 suspended 상태일 수 있어 클릭 후 resume 필요
await audioContext.resume();

// ✅ 복잡한 로직에 단계별 주석
function calculateStreak(records) {
  // 1. 오늘 날짜 기준으로 정렬
  // 2. 연속된 날짜가 끊기는 지점 탐색
  // 3. 끊긴 이후는 카운트 제외
}

// ❌ WHAT을 반복하는 불필요한 주석
// i를 1 증가시킨다
i++;
```

---

## 5. 컴포넌트 설계 원칙

### 5-1. 단일 책임 원칙
```
각 컴포넌트는 하나의 역할만 담당한다.

PostureCheck     → 자세 체크 화면만
TimerDisplay     → 타이머 숫자 표시만
PhaseProgress    → 구간 진행 바만
MetronomeBeep    → 박자 소리만 (UI 없음)
```

### 5-2. 서비스 / UI 분리
```
UI 컴포넌트     → 렌더링·이벤트 처리만
서비스 모듈     → 데이터·비즈니스 로직만
스토어          → 상태 관리만

// ✅ 올바른 분리
// timer.service.js — 타이머 로직
export function createTimer(duration, onTick, onComplete) { ... }

// TimerDisplay.js — UI만
const timer = timerService.create(phase.duration, updateDisplay, goNextPhase);
```

### 5-3. 상태 관리 규칙
```javascript
// 1단계 (Vanilla JS) — 단순 모듈 스토어
// stores/practice.store.js

const state = {
  currentPhase: 0,
  isRunning: false,
  elapsed: 0,
  sessionDate: null,
};

const listeners = new Set();

export function getState() { return { ...state }; }

export function setState(patch) {
  Object.assign(state, patch);
  listeners.forEach(fn => fn(getState()));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn); // unsubscribe 반환
}
```

---

## 6. 데이터 스키마

### 6-1. 연습 세션 기록
```javascript
// IndexedDB: 'sessions' store
{
  id:          'session_20250605_001',  // YYYY-MM-DD_순번
  date:        '2025-06-05',
  startedAt:   1717545600000,           // Unix timestamp
  endedAt:     1717547400000,
  duration:    1800,                    // 초
  phases: [
    { id: 'warmup',     completed: true,  duration: 310 },
    { id: 'technique',  completed: true,  duration: 605 },
    { id: 'repertoire', completed: true,  duration: 592 },
    { id: 'review',     completed: true,  duration: 293 },
  ],
  repertoire: {
    pieceId:    'beethoven_pathetique_2',
    measures:   '5-12',                 // 오늘 연습한 마디
    targetBpm:  80,
    achievedBpm: 72,
    hand:       'both',                 // 'right' | 'left' | 'both'
  },
  note: {
    wellDone:   '왼손 리듬이 안정됐다',
    tomorrow:   '9~12마디 집중',
    rating:     4,                      // 1~5 별점
  },
  questCompleted: false,                // 공중 피아노 퀘스트
}
```

### 6-2. 스트릭 데이터
```javascript
// localStorage: 'kd_streak'
{
  currentStreak:  47,
  longestStreak:  62,
  lastPracticed:  '2025-06-04',
  totalDays:      89,
  totalDuration:  162000,               // 초 (총 누적)
  badges: [
    { id: 'streak_7',   earnedAt: '2025-04-20' },
    { id: 'streak_30',  earnedAt: '2025-05-15' },
    { id: 'hours_10',   earnedAt: '2025-04-28' },
  ],
}
```

### 6-3. 레퍼토리
```javascript
// IndexedDB: 'repertoire' store
{
  id:           'beethoven_pathetique_2',
  title:        '비창 2악장',
  composer:     '베토벤',
  status:       'in_progress',          // 'goal' | 'in_progress' | 'completed'
  difficulty:   4,                      // 1~5
  targetBpm:    88,
  currentBpm:   72,
  totalMeasures: 73,
  learnedMeasures: 22,
  startedAt:    '2025-04-15',
  completedAt:  null,
  versions: [                           // 단계별 편곡
    { level: 1, label: '쉬운 버전',  unlocked: true  },
    { level: 2, label: '중간 버전',  unlocked: false },
    { level: 3, label: '원곡',       unlocked: false },
  ],
  notes: ['왼손 5-8마디 반복 필요', 'BPM 60부터 시작'],
}
```

---

## 7. 오디오 (Web Audio API) 원칙

```javascript
// src/services/metronome.service.js
// 메트로놈은 ScriptProcessor 대신 AudioWorklet 또는
// setTimeout 기반으로 구현 (정확도·호환성 균형)

const METRONOME_RULES = {
  // 초보자 모드: 1~2개월간 메트로놈 자동 비활성화 권장
  beginnerMode: true,

  // BPM 범위
  minBpm: 40,
  maxBpm: 208,
  defaultBpm: 60,

  // 클릭음: 첫 박 강조 (accent)
  accentVolume: 0.9,
  normalVolume: 0.6,
};

// AudioContext는 사용자 인터랙션 후 생성 (브라우저 정책)
let audioContext = null;

export function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}
```

---

## 8. 접근성 (A11y) 체크리스트

```
모든 컴포넌트는 배포 전 아래를 확인한다.

[ ] 모든 버튼·링크에 aria-label 또는 명확한 텍스트
[ ] 색상만으로 상태를 구분하지 않음 (아이콘·텍스트 병행)
[ ] 키보드 탐색 가능 (Tab 순서, Enter/Space 작동)
[ ] 타이머·메트로놈은 시각 외 청각 피드백 제공
[ ] 폰트 최소 크기 14px (모바일 16px)
[ ] 명암비 WCAG AA 기준 (4.5:1) 이상
[ ] 애니메이션은 prefers-reduced-motion 존중
```

```css
/* 필수 포함 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. 성능 원칙

```
[ ] 초기 번들 < 200KB (gzip)
[ ] Lighthouse PWA 점수 > 90
[ ] 타이머 정확도: ±10ms 이내
[ ] 메트로놈 레이턴시: < 20ms
[ ] localStorage 쓰기: 디바운스 500ms
[ ] IndexedDB: 트랜잭션은 최소 단위로
```

---

## 10. Git 커밋 컨벤션

```
형식: <type>(<scope>): <subject>

type:
  feat     새 기능
  fix      버그 수정
  style    CSS·디자인 변경
  refactor 로직 변경 (기능 변화 없음)
  docs     문서 수정
  test     테스트 추가·수정
  chore    빌드·설정 변경

scope (선택):
  timer | metronome | calendar | posture
  repertoire | notes | charts | ai | pwa | storage

예시:
  feat(timer): 30분 4구간 루틴 타이머 구현
  feat(posture): 자세 체크리스트 3항목 추가
  fix(metronome): iOS Safari AudioContext 재개 버그 수정
  style(calendar): 스트릭 강조 색상 인디고로 변경
  feat(ai): Claude API 연습 리뷰 생성 연동
```

---

## 11. 단계별 개발 순서 (로드맵)

```
Phase 1 — 습관 형성 (1~2개월)
  [1] 프로젝트 초기 세팅 (Vite + CSS 토큰 + PWA)
  [2] 자세 체크리스트 컴포넌트
  [3] 30분 루틴 타이머 (4구간)
  [4] 메트로놈 (Web Audio API)
  [5] 스트릭 캘린더 + localStorage
  [6] 배지 시스템
  [7] PWA 알림 (공중 피아노 퀘스트)
  [8] GitHub Pages 배포

Phase 2 — 실력 향상 (3~6개월)
  [1] IndexedDB 마이그레이션
  [2] 연습 노트 + 자기 평가
  [3] 레퍼토리 관리 + 단계별 편곡
  [4] 악보 읽기 훈련 (VexFlow)
  [5] 온음/반음 퍼즐 게임
  [6] 성장 그래프 (Chart.js)
  [7] Netlify 배포 + 커스텀 도메인

Phase 3 — 몰입 심화 (6개월+)
  [1] Claude API 연동 (AI 연습 코치)
  [2] 연주 녹음 아카이브 (MediaRecorder)
  [3] 오버트레이닝 방지 타이머
  [4] Supabase 클라우드 저장
  [5] AI 자세 체크 가이드
  [6] 연간 리포트 생성
```

---

## 12. Claude Code 작업 규칙

> Claude Code로 코드를 생성할 때 반드시 따르는 규칙

```
1. 이 CLAUDE.md를 먼저 읽고 시작한다.

2. 새 파일 생성 시 디렉터리 구조(§2)를 따른다.

3. 색상·간격은 반드시 CSS 토큰(§3)을 사용한다.
   ❌ color: #2d2680;
   ✅ color: var(--color-indigo);

4. 데이터 저장은 스키마(§6)의 구조를 따른다.

5. 컴포넌트는 단일 책임 원칙(§5-1)을 지킨다.

6. 커밋 전 A11y 체크리스트(§8)를 확인한다.

7. 새 기능 추가 시 로드맵 순서(§11)를 따른다.
   순서를 건너뛰거나 미래 단계 코드를 미리 작성하지 않는다.

8. 한국어 UI 텍스트는 별도 상수로 관리한다.
   ❌ <button>연습 시작</button>
   ✅ <button>{UI_TEXT.START_PRACTICE}</button>

9. TODO/FIXME 주석을 남길 때는 반드시 이유를 적는다.
   ✅ // TODO: iOS Safari에서 AudioContext 정책 변경 시 업데이트 필요

10. 기존 코드를 수정할 때는 변경 이유를 주석이나 커밋에 명시한다.
```

---

*마지막 업데이트: 2025-06-05 | 버전: 1.0.0*
*프로젝트 목표: 비창 2악장 완주 — 1년 후*
