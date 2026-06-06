/**
 * Supabase REST API 연동 (fetch 직접 호출 — 클라이언트 라이브러리 불필요).
 *
 * Supabase 프로젝트 초기 설정 SQL (SQL Editor에서 실행):
 * ─────────────────────────────────────────────────────
 * CREATE TABLE IF NOT EXISTS sessions (
 *   id          TEXT PRIMARY KEY,
 *   date        TEXT,
 *   duration    INTEGER,
 *   note        JSONB,
 *   repertoire  JSONB,
 *   started_at  BIGINT,
 *   ended_at    BIGINT,
 *   synced_at   TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- 개인 앱: RLS 비활성화 (anon key를 아는 기기만 접근)
 * ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
 * ─────────────────────────────────────────────────────
 * Storage: Dashboard > Storage > Create bucket "recordings" (private)
 */

const CONFIG_KEY    = 'kd_supabase_config';
const LAST_SYNC_KEY = 'kd_last_sync';

export function getConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveConfig({ url, anonKey }) {
  const clean = { url: url.trim().replace(/\/$/, ''), anonKey: anonKey.trim() };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(clean));
}

export function clearConfig() {
  localStorage.removeItem(CONFIG_KEY);
  localStorage.removeItem(LAST_SYNC_KEY);
}

export function isConfigured() {
  const c = getConfig();
  return !!(c?.url && c?.anonKey);
}

export function getLastSync() {
  const v = localStorage.getItem(LAST_SYNC_KEY);
  return v ? Number(v) : null;
}

export function setLastSync(ts) {
  localStorage.setItem(LAST_SYNC_KEY, String(ts));
}

function apiHeaders(config) {
  return {
    'Content-Type': 'application/json',
    'apikey':        config.anonKey,
    'Authorization': `Bearer ${config.anonKey}`,
  };
}

/**
 * Supabase REST 연결 테스트.
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function testConnection() {
  const config = getConfig();
  if (!config) return { success: false, error: '설정 없음' };

  try {
    const res = await fetch(`${config.url}/rest/v1/sessions?select=id&limit=1`, {
      headers: apiHeaders(config),
    });
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * 연습 세션 목록을 Supabase에 upsert한다.
 * @param {object[]} sessions
 * @returns {Promise<{ success: boolean, synced: number, error?: string }>}
 */
export async function syncSessions(sessions) {
  const config = getConfig();
  if (!config) return { success: false, synced: 0, error: '설정 없음' };
  if (sessions.length === 0) return { success: true, synced: 0 };

  const records = sessions.map((s) => ({
    id:         s.id,
    date:       s.date,
    duration:   s.duration ?? 0,
    note:       s.note ?? null,
    repertoire: s.repertoire ?? null,
    started_at: s.startedAt ?? null,
    ended_at:   s.endedAt   ?? null,
  }));

  try {
    const res = await fetch(`${config.url}/rest/v1/sessions`, {
      method: 'POST',
      headers: {
        ...apiHeaders(config),
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(records),
    });

    if (!res.ok) return { success: false, synced: 0, error: await res.text() };
    return { success: true, synced: records.length };
  } catch (err) {
    return { success: false, synced: 0, error: err.message };
  }
}

/**
 * 녹음 Blob을 Supabase Storage "recordings" 버킷에 업로드한다.
 * @param {{ id: string, date: string, blob: Blob, mimeType: string }} recording
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function uploadRecording(recording) {
  const config = getConfig();
  if (!config || !recording.blob) return { success: false, error: '설정 없음' };

  const ext = recording.mimeType?.includes('mp4') ? 'm4a'
    : recording.mimeType?.includes('ogg') ? 'ogg'
    : 'webm';
  const path = `${recording.date}/${recording.id}.${ext}`;

  try {
    const res = await fetch(`${config.url}/storage/v1/object/recordings/${path}`, {
      method:  'POST',
      headers: {
        'apikey':        config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
        'Content-Type':  recording.mimeType ?? 'audio/webm',
        'x-upsert':      'true',
      },
      body: recording.blob,
    });

    if (!res.ok) return { success: false, error: await res.text() };
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
