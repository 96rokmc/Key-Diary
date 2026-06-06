import { load, saveNow } from './storage.service.js';
import { today } from '../utils/date.utils.js';

const SETTINGS_KEY = 'notification_settings';

/** @returns {{ enabled: boolean, hour: number, minute: number, lastShown: string|null }} */
export function getNotificationSettings() {
  return load(SETTINGS_KEY) ?? { enabled: false, hour: 9, minute: 0, lastShown: null };
}

/** @param {Partial<ReturnType<typeof getNotificationSettings>>} patch */
export function saveNotificationSettings(patch) {
  saveNow(SETTINGS_KEY, { ...getNotificationSettings(), ...patch });
}

export function isSupported() {
  return 'Notification' in window;
}

export function getPermissionState() {
  if (!isSupported()) return 'unsupported';
  return Notification.permission;
}

/** @returns {Promise<NotificationPermission>} */
export async function requestPermission() {
  if (!isSupported()) return 'denied';
  return Notification.requestPermission();
}

/**
 * @param {string} title
 * @param {{ body?: string, icon?: string }} [opts]
 */
export function showNotification(title, { body, icon = '/icon-192.png' } = {}) {
  if (getPermissionState() !== 'granted') return;
  new Notification(title, { body, icon, badge: icon });
}

/**
 * 앱 로드 시 호출.
 * 오늘 아직 알림을 보내지 않았고 현재 시각이 설정된 시간 이후면 알림을 발송한다.
 */
export function checkAndFireReminder() {
  const settings = getNotificationSettings();
  if (!settings.enabled || getPermissionState() !== 'granted') return;
  if (settings.lastShown === today()) return;

  const now = new Date();
  const fire = new Date();
  fire.setHours(settings.hour, settings.minute, 0, 0);

  if (now >= fire) {
    showNotification('건반일기 — 오늘 연습할 시간이에요', {
      body: '30분 루틴을 시작하고 오늘의 스트릭을 이어가세요.',
    });
    saveNotificationSettings({ lastShown: today() });
  }
}

/**
 * 지정 시각까지 남은 ms를 계산해 타이머를 등록한다.
 * 페이지가 열려 있는 동안에만 동작한다.
 *
 * @returns {() => void} cancel 함수
 */
export function scheduleReminder() {
  const settings = getNotificationSettings();
  if (!settings.enabled || getPermissionState() !== 'granted') return () => {};

  const now = new Date();
  const fire = new Date();
  fire.setHours(settings.hour, settings.minute, 0, 0);

  // 오늘 지정 시각이 이미 지났으면 내일로 설정
  if (fire <= now) fire.setDate(fire.getDate() + 1);

  const delay = fire - now;
  const id = setTimeout(() => {
    if (getNotificationSettings().lastShown !== today()) {
      showNotification('건반일기 — 오늘 연습할 시간이에요', {
        body: '30분 루틴을 시작하고 오늘의 스트릭을 이어가세요.',
      });
      saveNotificationSettings({ lastShown: today() });
    }
  }, delay);

  return () => clearTimeout(id);
}
