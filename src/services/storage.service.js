/**
 * localStorage 추상화 레이어.
 * 쓰기는 500ms 디바운스로 묶어 불필요한 직렬화를 줄인다.
 */

const PREFIX = 'kd_';
const DEBOUNCE_MS = 500;

const writeTimers = {};

/** @param {string} key @returns {any | null} */
export function load(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** @param {string} key @param {any} value */
export function save(key, value) {
  clearTimeout(writeTimers[key]);
  writeTimers[key] = setTimeout(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (error) {
      console.error('[storage] 저장 실패:', error);
    }
  }, DEBOUNCE_MS);
}

/** 즉시 저장 (앱 종료 직전 등 디바운스 불가 상황) */
export function saveNow(key, value) {
  clearTimeout(writeTimers[key]);
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (error) {
    console.error('[storage] 즉시 저장 실패:', error);
  }
}

/** @param {string} key */
export function remove(key) {
  clearTimeout(writeTimers[key]);
  localStorage.removeItem(PREFIX + key);
}
