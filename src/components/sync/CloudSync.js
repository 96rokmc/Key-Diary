import './sync.css';
import { UI_TEXT } from '../../constants/ui-text.js';
import {
  isConfigured,
  saveConfig,
  clearConfig,
  getLastSync,
  setLastSync,
  testConnection,
  syncSessions,
  uploadRecording,
} from '../../services/supabase.service.js';
import { getSessions } from '../../services/storage.service.js';
import { getAllRecordings } from '../../services/storage.service.js';

/**
 * Supabase 클라우드 동기화 패널.
 * 미연결: 설정 폼 → 연결 테스트 후 저장
 * 연결됨: 동기화 버튼 + 마지막 동기화 시각
 *
 * @returns {HTMLElement}
 */
export function CloudSync() {
  const el = document.createElement('div');
  el.className = 'cloud-sync';
  el.setAttribute('data-destroy', '');

  let configured = isConfigured();
  let syncing    = false;
  let statusType = null;   // 'ok' | 'err' | null
  let statusMsg  = '';

  function render() {
    configured ? renderPanel() : renderConfigForm();
  }

  // ── 설정 폼 ───────────────────────────────────────────────
  function renderConfigForm() {
    el.innerHTML = `
      <h3 class="cs-title">${UI_TEXT.SYNC_TITLE}</h3>
      <p class="cs-desc">${UI_TEXT.SYNC_DESC}</p>
      <form class="cs-form" id="cs-form">
        <div class="cs-field">
          <label class="cs-label" for="cs-url">${UI_TEXT.SYNC_URL_LABEL}</label>
          <input type="url" id="cs-url" class="cs-input"
                 placeholder="https://xxxx.supabase.co" required />
        </div>
        <div class="cs-field">
          <label class="cs-label" for="cs-key">${UI_TEXT.SYNC_KEY_LABEL}</label>
          <input type="password" id="cs-key" class="cs-input"
                 placeholder="eyJ..." autocomplete="off" required />
        </div>
        <div class="cs-status-wrap" id="cs-status-wrap"></div>
        <button type="submit" class="cs-btn cs-btn--primary" id="cs-connect-btn">
          ${UI_TEXT.SYNC_CONNECT}
        </button>
      </form>
    `;
    el.querySelector('#cs-form')?.addEventListener('submit', handleConfig);
  }

  // ── 동기화 패널 ───────────────────────────────────────────
  function renderPanel() {
    const lastSync = getLastSync();
    const lastLabel = lastSync
      ? UI_TEXT.SYNC_LAST(new Date(lastSync).toLocaleString('ko-KR'))
      : UI_TEXT.SYNC_NEVER;

    el.innerHTML = `
      <div class="cs-header-row">
        <h3 class="cs-title">${UI_TEXT.SYNC_TITLE}</h3>
        <button class="cs-disconnect-btn" id="cs-disconnect">
          ${UI_TEXT.SYNC_DISCONNECT}
        </button>
      </div>
      <p class="cs-last-sync">${lastLabel}</p>

      ${statusType === 'ok'  ? `<p class="cs-status cs-status--ok">✓ ${statusMsg}</p>`  : ''}
      ${statusType === 'err' ? `<p class="cs-status cs-status--err">✗ ${statusMsg}</p>` : ''}

      <button class="cs-btn cs-btn--primary ${syncing ? 'cs-btn--loading' : ''}"
              id="cs-sync" ${syncing ? 'disabled' : ''}>
        ${syncing ? UI_TEXT.SYNC_ING : UI_TEXT.SYNC_NOW}
      </button>
    `;

    el.querySelector('#cs-sync')?.addEventListener('click', handleSync);
    el.querySelector('#cs-disconnect')?.addEventListener('click', handleDisconnect);
  }

  // ── 이벤트 핸들러 ─────────────────────────────────────────
  async function handleConfig(e) {
    e.preventDefault();
    const url    = el.querySelector('#cs-url')?.value?.trim();
    const anonKey = el.querySelector('#cs-key')?.value?.trim();
    const btn    = el.querySelector('#cs-connect-btn');
    const wrap   = el.querySelector('#cs-status-wrap');

    if (btn) { btn.disabled = true; btn.textContent = '연결 중…'; }

    saveConfig({ url, anonKey });
    const test = await testConnection();

    if (!test.success) {
      clearConfig();
      if (wrap) {
        wrap.innerHTML = `<p class="cs-status cs-status--err">${UI_TEXT.SYNC_CONNECT_FAIL(test.error)}</p>`;
      }
      if (btn) { btn.disabled = false; btn.textContent = UI_TEXT.SYNC_CONNECT; }
      return;
    }

    configured = true;
    render();
  }

  async function handleSync() {
    syncing    = true;
    statusType = null;
    render();

    try {
      const [sessions, recordings] = await Promise.all([getSessions(), getAllRecordings()]);

      const sessResult = await syncSessions(sessions);
      if (!sessResult.success) throw new Error(sessResult.error);

      let recSynced = 0;
      for (const rec of recordings) {
        if (rec.blob) {
          const r = await uploadRecording(rec);
          if (r.success) recSynced++;
        }
      }

      setLastSync(Date.now());
      statusType = 'ok';
      statusMsg  = UI_TEXT.SYNC_OK(sessResult.synced, recSynced);
    } catch (err) {
      statusType = 'err';
      statusMsg  = UI_TEXT.SYNC_FAIL(err.message);
    }

    syncing = false;
    render();
  }

  function handleDisconnect() {
    if (!confirm(UI_TEXT.SYNC_DISCONNECT_CONFIRM)) return;
    clearConfig();
    configured = false;
    statusType = null;
    render();
  }

  render();
  return el;
}
