export const MIN_BPM = 40;
export const MAX_BPM = 208;
export const DEFAULT_BPM = 60;

/** @param {number} bpm */
export function clampBpm(bpm) {
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));
}

/** @param {number} bpm @returns {number} 박자 간격 (초) */
export function bpmToInterval(bpm) {
  return 60 / bpm;
}

/**
 * 탭 템포 계산기 팩토리.
 * 최근 8번의 탭 간격 평균으로 BPM 산출.
 * 2초 이상 간격 시 자동 리셋.
 */
export function createTapTempo() {
  const MAX_TAPS = 8;
  const RESET_MS = 2000;
  let taps = [];

  return {
    tap() {
      const now = Date.now();
      if (taps.length > 0 && now - taps[taps.length - 1] > RESET_MS) {
        taps = [];
      }
      taps.push(now);
      if (taps.length > MAX_TAPS) taps.shift();
      if (taps.length < 2) return null;

      const intervals = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avgMs = intervals.reduce((s, v) => s + v, 0) / intervals.length;
      return clampBpm(Math.round(60000 / avgMs));
    },
    reset() {
      taps = [];
    },
  };
}
