import { PRACTICE_PHASES, TOTAL_SESSION_DURATION } from '../constants/phases.js';

const state = {
  currentPhaseIndex: 0,
  isRunning: false,
  sessionElapsed: 0, // 전체 세션 경과 (초)
  phaseElapsed: 0, // 현재 구간 경과 (초)
  sessionStartedAt: null, // 세션 시작 타임스탬프
  completedPhases: [], // 완료된 구간 id 배열
};

const listeners = new Set();

export function getState() {
  return { ...state };
}

export function setState(patch) {
  Object.assign(state, patch);
  listeners.forEach((fn) => fn(getState()));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ── 파생 값 ──

export function getCurrentPhase() {
  return PRACTICE_PHASES[state.currentPhaseIndex] ?? null;
}

export function getPhaseRemaining() {
  const phase = getCurrentPhase();
  if (!phase) return 0;
  return Math.max(0, phase.duration - state.phaseElapsed);
}

export function getTotalRemaining() {
  return Math.max(0, TOTAL_SESSION_DURATION - state.sessionElapsed);
}

export function isLastPhase() {
  return state.currentPhaseIndex === PRACTICE_PHASES.length - 1;
}

export function isSessionComplete() {
  return state.completedPhases.length === PRACTICE_PHASES.length;
}
