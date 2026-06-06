import { bpmToInterval, clampBpm, DEFAULT_BPM } from '../utils/bpm.utils.js';

const LOOKAHEAD_S = 0.1; // 100ms 미리 스케줄
const SCHEDULE_INTERVAL_MS = 25;
const CLICK_DURATION_S = 0.04;

// AudioContext 지연 생성 — 브라우저 정책상 사용자 인터랙션 후 생성해야 한다
let sharedCtx = null;

function getAudioContext() {
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return sharedCtx;
}

function scheduleClick(ctx, time, isAccent) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.frequency.value = isAccent ? 1200 : 900;
  gain.gain.setValueAtTime(isAccent ? 0.9 : 0.6, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + CLICK_DURATION_S);

  osc.start(time);
  osc.stop(time + CLICK_DURATION_S);
}

/**
 * Look-ahead 스케줄링 메트로놈.
 * AudioContext 타임라인에 미리 클릭음을 등록해 setInterval 지터를 피한다.
 *
 * @param {object} opts
 * @param {number}   [opts.bpm=60]
 * @param {number}   [opts.beatsPerMeasure=4]
 * @param {(beat: number) => void} [opts.onBeat] - 시각 업데이트용 콜백 (오디오 타이밍 기준)
 * @returns {{ start, stop, setBpm, getBpm, destroy }}
 */
export function createMetronome({ bpm = DEFAULT_BPM, beatsPerMeasure = 4, onBeat } = {}) {
  let currentBpm = clampBpm(bpm);
  let currentBeat = 0;
  let nextBeatTime = 0;
  let schedulerId = null;
  let running = false;

  function scheduler() {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    while (nextBeatTime < now + LOOKAHEAD_S) {
      const beat = currentBeat;
      const beatTime = nextBeatTime;

      scheduleClick(ctx, beatTime, beat === 0);

      // 시각 피드백은 오디오 타이밍에 맞춰 지연 호출
      if (onBeat) {
        const delayMs = Math.max(0, (beatTime - now) * 1000);
        setTimeout(() => onBeat(beat), delayMs);
      }

      currentBeat = (currentBeat + 1) % beatsPerMeasure;
      nextBeatTime += bpmToInterval(currentBpm);
    }

    schedulerId = setTimeout(scheduler, SCHEDULE_INTERVAL_MS);
  }

  return {
    start() {
      if (running) return;
      running = true;
      const ctx = getAudioContext();
      // iOS Safari 등에서 suspended 상태일 수 있어 resume 필요
      ctx.resume().then(() => {
        nextBeatTime = ctx.currentTime + 0.05;
        currentBeat = 0;
        scheduler();
      });
    },

    stop() {
      running = false;
      clearTimeout(schedulerId);
    },

    setBpm(newBpm) {
      currentBpm = clampBpm(newBpm);
    },

    getBpm() {
      return currentBpm;
    },

    destroy() {
      this.stop();
    },
  };
}
