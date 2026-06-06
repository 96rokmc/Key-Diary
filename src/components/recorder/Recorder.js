import './recorder.css';
import { UI_TEXT } from '../../constants/ui-text.js';
import {
  isRecordingSupported,
  startRecording,
  stopRecording,
  isRecording,
  getElapsedSeconds,
} from '../../services/recorder.service.js';
import { addRecording } from '../../services/storage.service.js';
import { today } from '../../utils/date.utils.js';
import { showToast } from '../../services/toast.service.js';

/**
 * 연습 타이머 화면에 붙는 소형 녹음 위젯.
 * 녹음 중지 시 IndexedDB에 자동 저장한다.
 *
 * @returns {HTMLElement | null}  녹음 미지원 브라우저에서는 null
 */
export function Recorder() {
  if (!isRecordingSupported()) return null;

  const el = document.createElement('div');
  el.className = 'recorder';
  el.setAttribute('data-destroy', '');

  let tickInterval = null;

  function render(elapsed = 0) {
    const recording = isRecording();
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const ss = String(elapsed % 60).padStart(2, '0');

    el.innerHTML = recording
      ? `<div class="rec-active">
           <span class="rec-dot" aria-hidden="true"></span>
           <span class="rec-timer" aria-live="polite" aria-label="녹음 경과 시간">${mm}:${ss}</span>
           <button class="rec-stop-btn" id="rec-stop" aria-label="녹음 중지">
             ${UI_TEXT.RECORDER_STOP}
           </button>
         </div>`
      : `<button class="rec-start-btn" id="rec-start">
           <span class="rec-mic-icon" aria-hidden="true">🎙</span>
           ${UI_TEXT.RECORDER_START}
         </button>`;

    el.querySelector('#rec-start')?.addEventListener('click', handleStart);
    el.querySelector('#rec-stop')?.addEventListener('click', handleStop);
  }

  async function handleStart() {
    const result = await startRecording();
    if (!result.success) {
      showToast({ icon: '🎙', title: '녹음 오류', message: result.error, duration: 4000 });
      return;
    }
    tickInterval = setInterval(() => render(getElapsedSeconds()), 1000);
    render(0);
  }

  async function handleStop() {
    clearInterval(tickInterval);
    tickInterval = null;
    const result = await stopRecording();
    render();
    if (result) await saveRecording(result);
  }

  async function saveRecording({ blob, duration, mimeType }) {
    const date = today();
    const id   = `rec_${date.replace(/-/g, '')}_${Date.now()}`;
    await addRecording({
      id,
      date,
      createdAt: Date.now(),
      duration,
      title: `${date} 연습 녹음`,
      mimeType,
      size: blob.size,
      blob,
    });
    showToast({
      icon: '🎙',
      title: UI_TEXT.RECORDER_SAVED_TITLE,
      message: UI_TEXT.RECORDER_SAVED_MSG(duration),
      duration: 3000,
    });
  }

  el._destroy = () => {
    clearInterval(tickInterval);
    // 녹음 중 탭 이동 시 자동 저장 (fire-and-forget)
    if (isRecording()) {
      stopRecording().then((result) => {
        if (result && result.duration >= 5) saveRecording(result);
      });
    }
  };

  render();
  return el;
}
