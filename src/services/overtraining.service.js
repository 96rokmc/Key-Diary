import { getSessions } from './storage.service.js';
import { getStreakData } from '../stores/streak.store.js';
import { today } from '../utils/date.utils.js';

const DAILY_WARN_MINS = 60;   // 하루 60분 이상: 경고
const DAILY_LIMIT_MINS = 90;  // 하루 90분 이상: 강경고
const REST_DAY_STREAK = 14;   // 14일 연속: 휴식 권장
export const BREAK_AFTER_MS = 25 * 60 * 1000; // 25분 연속 → 스트레칭 알림

/**
 * 오늘 누적 연습 시간 및 스트릭 위험도를 반환한다.
 * @returns {Promise<{
 *   totalMins: number,
 *   isWarning: boolean,
 *   isOverloaded: boolean,
 *   currentStreak: number,
 *   isStreakRisk: boolean,
 * }>}
 */
export async function getTodayRisk() {
  const date     = today();
  const sessions = await getSessions({ from: date, to: date });
  const totalMins = sessions.reduce(
    (sum, s) => sum + Math.round((s.duration ?? 0) / 60),
    0,
  );
  const { currentStreak } = getStreakData();

  return {
    totalMins,
    isWarning:    totalMins >= DAILY_WARN_MINS && totalMins < DAILY_LIMIT_MINS,
    isOverloaded: totalMins >= DAILY_LIMIT_MINS,
    currentStreak,
    isStreakRisk: currentStreak > 0 && currentStreak % REST_DAY_STREAK === 0,
  };
}
