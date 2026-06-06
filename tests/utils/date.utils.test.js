import { describe, it, expect } from 'vitest';
import {
  toDateStr,
  parseDate,
  formatYearMonth,
  formatShortDate,
  formatDuration,
  getDaysInMonth,
  getFirstDayOfWeek,
  prevMonth,
  nextMonth,
  isToday,
  daysBefore,
} from '../../src/utils/date.utils.js';

describe('date.utils.js', () => {
  describe('toDateStr / parseDate', () => {
    it('Date 객체를 YYYY-MM-DD 문자열로 변환하고 역변환한다', () => {
      const date = new Date(2026, 5, 5); // 2026-06-05
      const str = toDateStr(date);
      expect(str).toBe('2026-06-05');

      const parsed = parseDate('2026-06-05');
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(5); // 0-based index
      expect(parsed.getDate()).toBe(5);
    });
  });

  describe('formatYearMonth', () => {
    it('년도와 월을 한글 형식으로 출력한다', () => {
      expect(formatYearMonth(2026, 6)).toBe('2026년 6월');
    });
  });

  describe('formatShortDate', () => {
    it('YYYY-MM-DD 날짜를 짧은 형식의 요일 포함 문자열로 포맷한다', () => {
      expect(formatShortDate('2026-06-05')).toBe('6월 5일 (금)');
    });
  });

  describe('formatDuration', () => {
    it('초 단위를 한글 지속 시간 포맷으로 변환한다', () => {
      expect(formatDuration(1800)).toBe('30분');
      expect(formatDuration(3600)).toBe('1시간');
      expect(formatDuration(5400)).toBe('1시간 30분');
    });
  });

  describe('getDaysInMonth / getFirstDayOfWeek', () => {
    it('특정 월의 총 일수와 1일의 요일을 계산한다', () => {
      expect(getDaysInMonth(2026, 6)).toBe(30);
      expect(getFirstDayOfWeek(2026, 6)).toBe(1); // 2026년 6월 1일은 월요일 (0=일, 1=월)
    });
  });

  describe('prevMonth / nextMonth', () => {
    it('이전 월과 다음 월을 년도 경계 처리를 포함해 계산한다', () => {
      expect(prevMonth(2026, 1)).toEqual({ year: 2025, month: 12 });
      expect(prevMonth(2026, 6)).toEqual({ year: 2026, month: 5 });
      expect(nextMonth(2026, 12)).toEqual({ year: 2027, month: 1 });
      expect(nextMonth(2026, 6)).toEqual({ year: 2026, month: 7 });
    });
  });

  describe('isToday', () => {
    it('오늘 날짜인지 여부를 확인한다', () => {
      const todayStr = toDateStr(new Date());
      expect(isToday(todayStr)).toBe(true);
      expect(isToday('2020-01-01')).toBe(false);
    });
  });

  describe('daysBefore', () => {
    it('두 날짜 간의 일수 차이를 계산한다', () => {
      expect(daysBefore('2026-06-01', '2026-06-05')).toBe(4);
    });
  });
});