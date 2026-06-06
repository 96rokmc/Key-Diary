const KO_WEEK = ['일', '월', '화', '수', '목', '금', '토'];

/** @returns {string} 'YYYY-MM-DD' */
export function today() {
  return toDateStr(new Date());
}

/** @param {Date} date @returns {string} 'YYYY-MM-DD' */
export function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** @param {string} dateStr 'YYYY-MM-DD' @returns {Date} */
export function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** @param {number} year @param {number} month 1-based @returns {string} '2026년 6월' */
export function formatYearMonth(year, month) {
  return `${year}년 ${month}월`;
}

/** @param {string} dateStr @returns {string} '6월 5일 (목)' */
export function formatShortDate(dateStr) {
  const d = parseDate(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${KO_WEEK[d.getDay()]})`;
}

/** @param {number} seconds @returns {string} '1시간 30분' */
export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

/** @param {number} year @param {number} month 1-based @returns {number} */
export function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/** @param {number} year @param {number} month 1-based @returns {number} 0=일 ~ 6=토 */
export function getFirstDayOfWeek(year, month) {
  return new Date(year, month - 1, 1).getDay();
}

/** @param {number} year @param {number} month @returns {{ year: number, month: number }} */
export function prevMonth(year, month) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

/** @param {number} year @param {number} month @returns {{ year: number, month: number }} */
export function nextMonth(year, month) {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

/** @param {string} dateStr @returns {boolean} */
export function isToday(dateStr) {
  return dateStr === today();
}

/**
 * dateStr이 base 기준으로 몇 일 전인지 반환.
 * @param {string} dateStr
 * @param {string} [base] - 기준일 (기본값: today)
 */
export function daysBefore(dateStr, base = today()) {
  const diff = parseDate(base) - parseDate(dateStr);
  return Math.round(diff / 86400000);
}
