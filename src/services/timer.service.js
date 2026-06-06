/**
 * Date.now() 기반 드리프트 보정 타이머.
 * setInterval 누적 오차를 막기 위해 매 tick마다 실제 경과 시간으로 remaining을 재계산한다.
 *
 * @param {object} opts
 * @param {number}   opts.duration   - 타이머 총 시간 (초)
 * @param {(remaining: number) => void} opts.onTick     - 매 초 호출
 * @param {() => void}                  opts.onComplete - 완료 시 호출
 * @returns {{ start: () => void, pause: () => void, resume: () => void, destroy: () => void }}
 */
export function createTimer({ duration, onTick, onComplete }) {
  let remaining = duration;
  let startedAt = null;
  let timeoutId = null;
  let active = false;

  function schedule() {
    // 다음 정수 초 경계까지 남은 ms를 계산해 오차를 보정한다
    const elapsed = (Date.now() - startedAt) / 1000;
    const nextTick = Math.floor(elapsed) + 1 - elapsed;
    timeoutId = setTimeout(tick, Math.max(0, nextTick * 1000));
  }

  function tick() {
    if (!active) return;
    const elapsed = (Date.now() - startedAt) / 1000;
    remaining = Math.max(0, duration - elapsed);

    onTick(remaining);

    if (remaining <= 0) {
      active = false;
      onComplete();
      return;
    }

    schedule();
  }

  return {
    get remaining() {
      return remaining;
    },

    start() {
      if (active) return;
      active = true;
      startedAt = Date.now();
      duration = remaining; // resume 시 남은 시간 기준으로 재시작
      startedAt = Date.now();
      tick();
    },

    pause() {
      if (!active) return;
      active = false;
      clearTimeout(timeoutId);
      // remaining은 마지막 tick 기준 값으로 유지
      const elapsed = (Date.now() - startedAt) / 1000;
      remaining = Math.max(0, duration - elapsed);
    },

    resume() {
      if (active) return;
      active = true;
      duration = remaining;
      startedAt = Date.now();
      tick();
    },

    destroy() {
      active = false;
      clearTimeout(timeoutId);
    },
  };
}
