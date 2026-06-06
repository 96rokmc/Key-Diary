let mediaRecorder = null;
let chunks        = [];
let startTime     = null;

export function isRecordingSupported() {
  return !!(
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined'
  );
}

function getMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

/**
 * 마이크 권한 요청 후 녹음을 시작한다.
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function startRecording() {
  try {
    const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getMimeType();

    chunks    = [];
    startTime = Date.now();
    mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.start(500); // 500ms 단위로 데이터 수집
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * 녹음을 중지하고 Blob을 반환한다.
 * @returns {Promise<{ blob: Blob, duration: number, mimeType: string } | null>}
 */
export function stopRecording() {
  return new Promise((resolve) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      resolve(null);
      return;
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    mediaRecorder.onstop = () => {
      const mimeType = mediaRecorder.mimeType;
      const blob     = new Blob(chunks, { type: mimeType });
      mediaRecorder.stream.getTracks().forEach((t) => t.stop());
      chunks        = [];
      mediaRecorder = null;
      resolve({ blob, duration, mimeType });
    };

    mediaRecorder.stop();
  });
}

export function isRecording() {
  return mediaRecorder?.state === 'recording';
}

export function getElapsedSeconds() {
  if (!startTime || !isRecording()) return 0;
  return Math.floor((Date.now() - startTime) / 1000);
}
