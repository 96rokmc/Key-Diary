import './toast.css';
import { onToast } from '../../services/toast.service.js';

const DEFAULT_DURATION = 4000;

/**
 * 앱 전역 토스트 컨테이너.
 * App.js 최상단에 마운트하며, toast.service.js 이벤트를 구독한다.
 *
 * @returns {HTMLElement}
 */
export function ToastContainer() {
  const el = document.createElement('div');
  el.className = 'toast-container';
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-atomic', 'false');
  el.setAttribute('role', 'status');

  const unsubscribe = onToast(({ icon, title, message, duration = DEFAULT_DURATION }) => {
    showToast(icon, title, message, duration);
  });

  el._destroy = unsubscribe;

  function showToast(icon, title, message, duration) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <span class="toast__icon" aria-hidden="true">${icon}</span>
      <div class="toast__body">
        <p class="toast__title">${title}</p>
        ${message ? `<p class="toast__message">${message}</p>` : ''}
      </div>
      <button class="toast__close" aria-label="알림 닫기">✕</button>
      <div class="toast__progress" style="animation-duration: ${duration}ms"></div>
    `;

    toast.querySelector('.toast__close').addEventListener('click', () => dismiss(toast));

    el.appendChild(toast);

    const timerId = setTimeout(() => dismiss(toast), duration);
    toast.dataset.timerId = timerId;
  }

  function dismiss(toast) {
    clearTimeout(Number(toast.dataset.timerId));
    toast.classList.add('toast--leaving');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }

  return el;
}
