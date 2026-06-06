import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { clampBpm, bpmToInterval, createTapTempo } from '../../src/utils/bpm.utils.js';

describe('bpm.utils.js', () => {
  describe('clampBpm', () => {
    it('BPM 범위 내의 값은 반올림하여 반환한다', () => {
      expect(clampBpm(60.4)).toBe(60);
      expect(clampBpm(80.6)).toBe(81);
    });

    it('최소 BPM(40) 미만의 값은 40으로 제한한다', () => {
      expect(clampBpm(30)).toBe(40);
    });

    it('최대 BPM(208) 초과의 값은 208로 제한한다', () => {
      expect(clampBpm(250)).toBe(208);
    });
  });

  describe('bpmToInterval', () => {
    it('BPM에 대응하는 초 단위 간격을 계산한다', () => {
      expect(bpmToInterval(60)).toBe(1);
      expect(bpmToInterval(120)).toBe(0.5);
    });
  });

  describe('createTapTempo', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('두 번 이상 탭했을 때 올바른 BPM을 계산한다', () => {
      const tapTempo = createTapTempo();
      
      tapTempo.tap();
      vi.advanceTimersByTime(1000); // 1초 간격 (60 BPM)
      
      const bpm = tapTempo.tap();
      expect(bpm).toBe(60);
    });

    it('2초 이상 탭이 지연되면 탭 기록을 리셋한다', () => {
      const tapTempo = createTapTempo();
      
      tapTempo.tap();
      vi.advanceTimersByTime(2500); // 2.5초 지연
      
      const bpm = tapTempo.tap();
      expect(bpm).toBeNull(); // 첫 탭으로 다시 인식
    });
  });
});