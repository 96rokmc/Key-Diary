import { load, save, saveNow, addSession } from '../services/storage.service.js';
import { showToast } from '../services/toast.service.js';
import { BADGES } from '../constants/badges.js';
import { today, daysBefore } from '../utils/date.utils.js';

const STREAK_KEY = 'streak';
const DATES_KEY = 'practiced_dates';

function defaultStreak() {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastPracticed: null,
    totalDays: 0,
    totalDuration: 0,
    badges: [], // [{ id, earnedAt }]
  };
}

let streakData = load(STREAK_KEY) ?? defaultStreak();
/** @type {Set<string>} */
let practicedDates = new Set(load(DATES_KEY) ?? []);

const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(getStreakData()));
}

export function getStreakData() {
  return { ...streakData, badges: [...streakData.badges] };
}

export function getPracticedDates() {
  return new Set(practicedDates);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * 오늘 연습 세션을 기록하고, 배지 조건을 검사한다.
 * @param {{ duration?: number }} opts
 */
export function recordSession({ duration = 0 } = {}) {
  const date = today();

  if (practicedDates.has(date)) {
    streakData.totalDuration += duration;
    save(STREAK_KEY, streakData);
    notify();
    return;
  }

  practicedDates.add(date);

  const { lastPracticed } = streakData;
  if (!lastPracticed) {
    streakData.currentStreak = 1;
  } else {
    const gap = daysBefore(lastPracticed, date);
    if (gap === 1) streakData.currentStreak += 1;
    else if (gap === 0) {
      /* 같은 날 재호출 — 위에서 처리 */
    } else streakData.currentStreak = 1;
  }

  streakData.longestStreak = Math.max(streakData.longestStreak, streakData.currentStreak);
  streakData.lastPracticed = date;
  streakData.totalDays += 1;
  streakData.totalDuration += duration;

  const newBadges = awardBadges(streakData);

  saveNow(STREAK_KEY, streakData);
  saveNow(DATES_KEY, [...practicedDates]);
  notify();

  // IndexedDB에 전체 세션 기록 저장 (비동기, UI 흐름을 막지 않음)
  const endedAt = Date.now();
  addSession({
    date,
    startedAt: endedAt - duration * 1000,
    endedAt,
    duration,
    phases: [],
    repertoire: null,
    note: null,
    questCompleted: false,
  }).catch((err) => console.error('[streak] IndexedDB 세션 저장 실패:', err));

  // 배지 알림은 저장 완료 후 표시 (약간 지연해 캘린더 전환 애니메이션과 겹치지 않게)
  newBadges.forEach((badge, i) => {
    setTimeout(
      () => {
        showToast({
          icon: badge.icon,
          title: `배지 획득: ${badge.label}`,
          message: badge.description,
          duration: 5000,
        });
      },
      800 + i * 600,
    );
  });
}

/**
 * 새로 달성한 배지를 streakData.badges에 추가하고 반환한다.
 * @param {object} data
 * @returns {typeof BADGES}
 */
function awardBadges(data) {
  const earnedIds = new Set(data.badges.map((b) => b.id));
  const newBadges = [];

  for (const badge of BADGES) {
    if (!earnedIds.has(badge.id) && badge.condition(data)) {
      data.badges.push({ id: badge.id, earnedAt: today() });
      newBadges.push(badge);
    }
  }

  return newBadges;
}

/** 개발/테스트용: 스토어 초기화 */
export function resetStreak() {
  streakData = defaultStreak();
  practicedDates = new Set();
  saveNow(STREAK_KEY, streakData);
  saveNow(DATES_KEY, []);
  notify();
}
