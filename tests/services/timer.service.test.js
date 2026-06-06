import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTimer } from '../../src/services/timer.service.js';

describe('timer.service.js', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('타이머가 시작되면 매 초마다 tick 이벤트를 발생시킨다', () => {
    const onTick = vi.fn();
    const onComplete = vi.fn();

    const timer = createTimer({
      duration: 3,
      onTick,
      onComplete,
    });

    timer.start();

    // 첫 시작 시 즉시 tick 호출
    expect(onTick).toHaveBeenCalledTimes(1);
    expect(onTick).toHaveBeenLastCalledWith(3);

    // 1초 경과
    vi.advanceTimersByTime(1000);
    expect(onTick).toHaveBeenCalledTimes(2);
    expect(onTick).toHaveBeenLastCalledWith(2);

    // 2초 경과
    vi.advanceTimersByTime(1000);
    expect(onTick).toHaveBeenCalledTimes(3);
    expect(onTick).toHaveBeenLastCalledWith(1);

    // 3초 경과 (완료)
    vi.advanceTimersByTime(1000);
    expect(onTick).toHaveBeenCalledTimes(4);
    expect(onTick).toHaveBeenLastCalledWith(0);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('일시정지(pause)와 이어하기(resume)가 정상 작동한다', () => {
    const onTick = vi.fn();
    const onComplete = vi.fn();

    const timer = createTimer({
      duration: 5,
      onTick,
      onComplete,
    });

    timer.start();
    
    vi.advanceTimersByTime(2000); // 2초 경과 (남은시간 3초)
    expect(onTick).toHaveBeenLastCalledWith(3);

    timer.pause();

    vi.advanceTimersByTime(2000); // 일시정지 상태에서 시간 경과
    expect(onTick).toHaveBeenLastCalledWith(3); // 시간 흐르지 않음

    timer.resume(); // 다시 시작
    expect(onTick).toHaveBeenLastCalledWith(3);

    vi.advanceTimersByTime(3000); // 3초 더 경과
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});