import { describe, it, expect } from 'vitest';
import { formatTime, formatTimeVerbose } from '../../src/utils/time.utils.js';

describe('time.utils.js', () => {
  describe('formatTime', () => {
    it('초 단위를 MM:SS 포맷으로 변환한다', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(5)).toBe('00:05');
      expect(formatTime(65)).toBe('01:05');
      expect(formatTime(3599)).toBe('59:59');
    });

    it('음수 입력 시 00:00으로 처리한다', () => {
      expect(formatTime(-10)).toBe('00:00');
    });
  });

  describe('formatTimeVerbose', () => {
    it('초 단위를 스크린리더용 친화적 텍스트로 변환한다', () => {
      expect(formatTimeVerbose(5)).toBe('5초 남음');
      expect(formatTimeVerbose(60)).toBe('1분 남음');
      expect(formatTimeVerbose(65)).toBe('1분 5초 남음');
    });
  });
});