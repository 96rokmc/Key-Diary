/**
 * 앱 전역 토스트 알림 이벤트 버스.
 * Toast 컴포넌트가 구독하고, 다른 모듈이 show()를 호출한다.
 *
 * @typedef {{ icon: string, title: string, message?: string, duration?: number }} ToastOptions
 */

const listeners = new Set();

/**
 * @param {ToastOptions} options
 */
export function showToast(options) {
  listeners.forEach((fn) => fn(options));
}

/** @param {(opts: ToastOptions) => void} fn @returns {() => void} unsubscribe */
export function onToast(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
