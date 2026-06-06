/**
 * @param {number} seconds
 * @returns {string} "MM:SS"
 */
export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * @param {number} seconds
 * @returns {string} 스크린리더용 텍스트 ("5분 3초 남음")
 */
export function formatTimeVerbose(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return `${sec}초 남음`;
  if (sec === 0) return `${m}분 남음`;
  return `${m}분 ${sec}초 남음`;
}
