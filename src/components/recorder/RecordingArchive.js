import './recorder.css';
import { UI_TEXT } from '../../constants/ui-text.js';
import { getAllRecordings, deleteRecording } from '../../services/storage.service.js';
import { showToast } from '../../services/toast.service.js';

/**
 * 캘린더 탭에 표시되는 녹음 아카이브.
 * 재생·다운로드·삭제 기능 포함.
 *
 * @returns {HTMLElement}
 */
export function RecordingArchive() {
  const el = document.createElement('div');
  el.className = 'recording-archive';
  el.setAttribute('data-destroy', '');

  const objectUrls = [];

  async function init() {
    const recordings = await getAllRecordings();
    render(recordings);
  }

  function render(recordings) {
    el.innerHTML = `
      <h3 class="ra-title">${UI_TEXT.ARCHIVE_TITLE}</h3>
      ${recordings.length === 0
        ? `<p class="ra-empty">${UI_TEXT.ARCHIVE_EMPTY}</p>`
        : `<ul class="ra-list">${recordings.map(renderItem).join('')}</ul>`
      }
    `;

    recordings.forEach((rec) => {
      el.querySelector(`#play-${CSS.escape(rec.id)}`)
        ?.addEventListener('click', () => handlePlay(rec));
      el.querySelector(`#dl-${CSS.escape(rec.id)}`)
        ?.addEventListener('click', () => handleDownload(rec));
      el.querySelector(`#del-${CSS.escape(rec.id)}`)
        ?.addEventListener('click', () => handleDelete(rec.id));
    });
  }

  function renderItem(rec) {
    const mm    = Math.floor(rec.duration / 60);
    const ss    = rec.duration % 60;
    const dur   = mm > 0 ? `${mm}분 ${ss > 0 ? ss + '초' : ''}` : `${ss}초`;
    const mb    = (rec.size / 1024 / 1024).toFixed(1);
    const safeId = CSS.escape(rec.id);

    return `
      <li class="ra-item">
        <div class="ra-item-info">
          <span class="ra-item-title">${rec.title}</span>
          <span class="ra-item-meta">${dur.trim()} · ${mb} MB</span>
        </div>
        <div class="ra-item-actions">
          <button class="ra-btn ra-btn--play" id="play-${safeId}" aria-label="재생">▶</button>
          <button class="ra-btn ra-btn--dl"   id="dl-${safeId}"   aria-label="다운로드">↓</button>
          <button class="ra-btn ra-btn--del"  id="del-${safeId}"  aria-label="삭제">×</button>
        </div>
      </li>
    `;
  }

  function getFileExt(mimeType) {
    if (mimeType.includes('mp4')) return 'm4a';
    if (mimeType.includes('ogg')) return 'ogg';
    return 'webm';
  }

  async function handlePlay(rec) {
    if (!rec.blob) return;
    const url = URL.createObjectURL(rec.blob);
    objectUrls.push(url);

    const audio = new Audio(url);
    audio.play().catch(() => {});
    audio.onended = () => URL.revokeObjectURL(url);

    const btn = el.querySelector(`#play-${CSS.escape(rec.id)}`);
    if (btn) {
      btn.textContent = '⏹';
      btn.onclick = () => { audio.pause(); audio.currentTime = 0; btn.textContent = '▶'; };
    }
  }

  function handleDownload(rec) {
    if (!rec.blob) return;
    const url = URL.createObjectURL(rec.blob);
    objectUrls.push(url);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rec.title}.${getFileExt(rec.mimeType)}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  async function handleDelete(id) {
    if (!confirm(UI_TEXT.ARCHIVE_DELETE_CONFIRM)) return;
    await deleteRecording(id);
    showToast({ icon: '🗑', title: '녹음 삭제', message: '녹음이 삭제됐습니다.', duration: 2000 });
    const recordings = await getAllRecordings();
    render(recordings);
  }

  el._destroy = () => {
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.length = 0;
  };

  init();
  return el;
}
