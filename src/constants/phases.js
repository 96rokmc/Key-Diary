export const PRACTICE_PHASES = [
  {
    id: 'warmup',
    label: '워밍업',
    duration: 300,
    color: 'var(--color-phase-1)',
    description: '손가락 스트레칭 + C장조 스케일',
  },
  {
    id: 'technique',
    label: '테크닉 훈련',
    duration: 600,
    color: 'var(--color-phase-1)',
    description: '손가락 독립 패턴 퀘스트',
  },
  {
    id: 'repertoire',
    label: '목표 곡 연습',
    duration: 600,
    color: 'var(--color-phase-2)',
    description: '비창 2악장 — 오늘 마디 집중',
  },
  {
    id: 'review',
    label: '복습 마무리',
    duration: 300,
    color: 'var(--color-phase-2)',
    description: '느린 템포 전체 복습 + 자기 평가',
  },
];

export const TOTAL_SESSION_DURATION = PRACTICE_PHASES.reduce(
  (sum, p) => sum + p.duration,
  0,
); // 1800초 = 30분
