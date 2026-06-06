import './quest.css';
import {
  isSupported,
  getPermissionState,
  requestPermission,
  getNotificationSettings,
  saveNotificationSettings,
  scheduleReminder,
} from '../../services/notification.service.js';
import { load, saveNow } from '../../services/storage.service.js';

const DISMISSED_KEY = 'notification_prompt_dismissed';

/**
 * 알림 활성화 요청 배너.
 * - 알림 미지원 / 이미 설정됨 / 사용자가 닫은 경우 null 반환 (렌더 불필요)
 *
 * @returns {HTMLElement | null}
 */
export function NotificationPrompt() {
  if (!isSupported()) return null;
  if (getPermissionState() === 'denied') return null;
  if (getNotificationSettings().enabled) return null;
  if (load(DISMISSED_KEY)) return null;

  const el = document.createElement('div');
  el.className = 'notification-prompt';
  el.setAttribute('role', 'complementary');
  el.setAttribute('aria-label', '연습 알림 설정');

  el.innerHTML = `
    <p class="notification-prompt__text">
      <strong>매일 연습 알림</strong>을 받으시겠어요?<br>
      원하는 시각에 알려드립니다.
    </p>
    <button class="notification-prompt__enable" aria-label="연습 알림 활성화">알림 받기</button>
    <button class="notification-prompt__dismiss" aria-label="알림 배너 닫기">✕</button>
  `;

  el.querySelector('.notification-prompt__enable').addEventListener('click', async () => {
    const permission = await requestPermission();
    if (permission === 'granted') {
      saveNotificationSettings({ enabled: true });
      scheduleReminder();
      el.replaceWith(renderSettings());
    } else {
      el.remove();
    }
  });

  el.querySelector('.notification-prompt__dismiss').addEventListener('click', () => {
    saveNow(DISMISSED_KEY, true);
    el.remove();
  });

  return el;
}

/**
 * 알림이 이미 활성화된 경우 보여주는 간단한 설정 패널.
 * @returns {HTMLElement}
 */
export function NotificationSettings() {
  const settings = getNotificationSettings();
  if (!settings.enabled) return null;

  return renderSettings();
}

function renderSettings() {
  const settings = getNotificationSettings();
  const hh = String(settings.hour).padStart(2, '0');
  const mm = String(settings.minute).padStart(2, '0');

  const el = document.createElement('div');
  el.className = 'notification-settings';
  el.innerHTML = `
    <div class="notification-settings__row">
      <span class="notification-settings__label">매일 연습 알림</span>
      <input type="time" class="notification-settings__time"
             value="${hh}:${mm}" aria-label="알림 시각 설정" />
    </div>
  `;

  let cancelPrev = () => {};

  el.querySelector('input').addEventListener('change', (e) => {
    const [h, m] = e.target.value.split(':').map(Number);
    saveNotificationSettings({ hour: h, minute: m });
    cancelPrev();
    cancelPrev = scheduleReminder();
  });

  cancelPrev = scheduleReminder();
  el._destroy = () => cancelPrev();

  return el;
}
