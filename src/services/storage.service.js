import { openDB } from 'idb';

// ── localStorage ──────────────────────────────────────────────────────────────

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

/** 디바운스 저장 (500ms) */
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

// ── IndexedDB ─────────────────────────────────────────────────────────────────

const DB_NAME    = 'keonban-ilgi';
const DB_VERSION = 2;

let _dbPromise = null;

function getDB() {
  if (!_dbPromise) {
    _dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const store = db.createObjectStore('sessions', { keyPath: 'id' });
          store.createIndex('by_date', 'date');
          db.createObjectStore('repertoire', { keyPath: 'id' });
        }
        if (oldVersion < 2) {
          // Blob 저장 지원 — IndexedDB는 구조화 복제로 Blob을 네이티브 지원
          const recStore = db.createObjectStore('recordings', { keyPath: 'id' });
          recStore.createIndex('by_date', 'date');
        }
      },
    });
  }
  return _dbPromise;
}

/**
 * 연습 세션을 저장한다. record.id 가 없으면 자동 생성 (session_YYYYMMDD_NNN).
 * @param {object} record  §6-1 스키마 참고
 * @returns {Promise<{ success: boolean, id?: string, error?: string }>}
 */
export async function addSession(record) {
  try {
    const db = await getDB();
    if (!record.id) {
      const count = await db.countFromIndex('sessions', 'by_date', record.date);
      const seq = String(count + 1).padStart(3, '0');
      record.id = `session_${record.date.replace(/-/g, '')}_${seq}`;
    }
    await db.put('sessions', record);
    return { success: true, id: record.id };
  } catch (error) {
    console.error('[db] 세션 저장 실패:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 세션 목록 조회. from/to 는 'YYYY-MM-DD' 문자열.
 * @param {{ from?: string, to?: string }} opts
 * @returns {Promise<object[]>}
 */
export async function getSessions({ from, to } = {}) {
  try {
    const db = await getDB();
    if (from && to) {
      return await db.getAllFromIndex('sessions', 'by_date', IDBKeyRange.bound(from, to));
    }
    if (from) {
      return await db.getAllFromIndex('sessions', 'by_date', IDBKeyRange.lowerBound(from));
    }
    return await db.getAll('sessions');
  } catch (error) {
    console.error('[db] 세션 조회 실패:', error);
    return [];
  }
}

/**
 * 단일 세션 조회.
 * @param {string} id
 * @returns {Promise<object | undefined>}
 */
export async function getSession(id) {
  try {
    const db = await getDB();
    return await db.get('sessions', id);
  } catch (error) {
    console.error('[db] 세션 조회 실패:', error);
    return undefined;
  }
}

/**
 * 세션 업데이트 (노트·레퍼토리 필드 보완 시 사용).
 * @param {string} id
 * @param {object} patch
 */
export async function updateSession(id, patch) {
  try {
    const db = await getDB();
    const existing = await db.get('sessions', id);
    if (!existing) return { success: false, error: '세션 없음' };
    await db.put('sessions', { ...existing, ...patch });
    return { success: true };
  } catch (error) {
    console.error('[db] 세션 업데이트 실패:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 전체 레퍼토리 목록 조회.
 * @returns {Promise<object[]>}
 */
export async function getAllRepertoire() {
  try {
    const db = await getDB();
    return await db.getAll('repertoire');
  } catch (error) {
    console.error('[db] 레퍼토리 조회 실패:', error);
    return [];
  }
}

/**
 * 레퍼토리 추가·업데이트 (upsert).
 * @param {object} item  §6-3 스키마 참고
 */
export async function upsertRepertoire(item) {
  try {
    const db = await getDB();
    await db.put('repertoire', item);
    return { success: true };
  } catch (error) {
    console.error('[db] 레퍼토리 저장 실패:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 레퍼토리 삭제.
 * @param {string} id
 */
export async function deleteRepertoire(id) {
  try {
    const db = await getDB();
    await db.delete('repertoire', id);
    return { success: true };
  } catch (error) {
    console.error('[db] 레퍼토리 삭제 실패:', error);
    return { success: false, error: error.message };
  }
}

// ── 녹음 아카이브 ──────────────────────────────────────────────────────────────

/**
 * 녹음 저장 (Blob 포함).
 * @param {{ id: string, date: string, createdAt: number, duration: number,
 *           title: string, mimeType: string, size: number, blob: Blob }} record
 */
export async function addRecording(record) {
  try {
    const db = await getDB();
    await db.put('recordings', record);
    return { success: true, id: record.id };
  } catch (error) {
    console.error('[db] 녹음 저장 실패:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 전체 녹음 목록 조회 (최신순).
 * @returns {Promise<object[]>}
 */
export async function getAllRecordings() {
  try {
    const db  = await getDB();
    const all = await db.getAll('recordings');
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('[db] 녹음 조회 실패:', error);
    return [];
  }
}

/**
 * 녹음 삭제.
 * @param {string} id
 */
export async function deleteRecording(id) {
  try {
    const db = await getDB();
    await db.delete('recordings', id);
    return { success: true };
  } catch (error) {
    console.error('[db] 녹음 삭제 실패:', error);
    return { success: false, error: error.message };
  }
}
