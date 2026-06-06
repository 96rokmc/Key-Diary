export const UI_TEXT = {
  APP_NAME: '건반일기',
  APP_TAGLINE: '매일 앉은 흔적이 쌓여 연주가 된다',
  COMING_SOON: 'Phase 1 — 세팅 완료. 다음 단계: 자세 체크리스트',

  START_PRACTICE: '연습 시작',
  STOP_PRACTICE: '연습 중단',
  COMPLETE_PHASE: '구간 완료',
  NEXT_PHASE: '다음 구간',
  SAVE: '저장',
  CANCEL: '취소',

  PHASE_WARMUP: '워밍업',
  PHASE_TECHNIQUE: '테크닉 훈련',
  PHASE_REPERTOIRE: '목표 곡 연습',
  PHASE_REVIEW: '복습 마무리',

  STREAK_DAYS: (n) => `${n}일 연속`,
  TOTAL_HOURS: (h) => `누적 ${h}시간`,

  NOTES_TITLE: '오늘 연습 돌아보기',
  NOTES_RATING_LABEL: '오늘 연습은 어땠나요?',
  NOTES_WELL_DONE_LABEL: '잘 된 점',
  NOTES_WELL_DONE_PLACEHOLDER: '오늘 잘 된 것을 한 줄로 적어보세요',
  NOTES_TOMORROW_LABEL: '내일 집중할 것',
  NOTES_TOMORROW_PLACEHOLDER: '내일은 이것을 집중해서 연습하자',
  NOTES_SAVE: '저장하기',
  NOTES_SKIP: '건너뛰기',
  NOTES_SAVED_TITLE: '연습 기록 저장!',
  NOTES_SAVED_MESSAGE: '오늘의 노트가 저장됐습니다.',

  AI_COACH_TITLE: 'AI 연습 코치',
  AI_COACH_SUBTITLE: '오늘의 연습을 돌아봅니다',
  AI_COACH_KEY_DESC: 'Anthropic API 키를 입력하면 AI 코치의 피드백을 받을 수 있습니다. 키는 이 기기에만 저장됩니다.',
  AI_COACH_KEY_PLACEHOLDER: 'sk-ant-...',
  AI_COACH_KEY_SAVE: '저장',
  AI_COACH_CTA_DESC: (mins) => `오늘 ${mins}분 연습 기록을 바탕으로\nAI 코치의 피드백을 받아보세요.`,
  AI_COACH_GENERATE: 'AI 리뷰 받기',
  AI_COACH_LOADING: '분석 중…',
  AI_COACH_DONE: '캘린더 보기 →',
  AI_COACH_SKIP: '건너뛰기',
  AI_COACH_RETRY: '다시 시도',
  AI_COACH_ERROR_PREFIX: '오류: ',
  AI_COACH_ERROR_NO_KEY: 'API 키가 설정되지 않았습니다.',

  RECORDER_START: '녹음',
  RECORDER_STOP: '중지',
  RECORDER_SAVED_TITLE: '녹음 저장됨',
  RECORDER_SAVED_MSG: (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m > 0 ? m + '분 ' : ''}${s}초 녹음이 저장됐습니다.`;
  },

  ARCHIVE_TITLE: '녹음 아카이브',
  ARCHIVE_EMPTY: '아직 저장된 녹음이 없습니다',
  ARCHIVE_DELETE_CONFIRM: '이 녹음을 삭제하시겠습니까?',

  OVERTRAINING_BREAK_TITLE: '손목 스트레칭 시간',
  OVERTRAINING_BREAK_MSG: '25분 연속 연습했습니다. 잠깐 손목·어깨를 스트레칭하고 물 한 잔 마셔보세요.',
  OVERTRAINING_WARN: (mins) => `오늘 이미 ${mins}분 연습했습니다. 하루 90분을 넘지 않도록 주의하세요.`,
  OVERTRAINING_LIMIT: (mins) => `오늘 누적 ${mins}분 — 과연습 주의! 손가락·손목 부상 예방을 위해 오늘은 가볍게 마무리하세요.`,
  OVERTRAINING_STREAK: (days) => `${days}일 연속 연습 중입니다. 일주일에 하루 완전 휴식이 근육 회복과 실력 향상에 효과적입니다.`,

  SYNC_TITLE: '☁ 클라우드 동기화',
  SYNC_DESC: 'Supabase 프로젝트와 연결하면 연습 기록·녹음을 클라우드에 백업합니다.',
  SYNC_URL_LABEL: 'Supabase URL',
  SYNC_KEY_LABEL: 'Anon Key',
  SYNC_CONNECT: '연결하기',
  SYNC_DISCONNECT: '연결 해제',
  SYNC_NOW: '지금 동기화',
  SYNC_ING: '동기화 중…',
  SYNC_LAST: (dt) => `마지막 동기화: ${dt}`,
  SYNC_NEVER: '아직 동기화 안 됨',
  SYNC_OK: (s, r) => `세션 ${s}개, 녹음 ${r}개 동기화 완료`,
  SYNC_FAIL: (msg) => `오류: ${msg}`,
  SYNC_CONNECT_FAIL: (msg) => `연결 실패: ${msg}`,
  SYNC_DISCONNECT_CONFIRM: '클라우드 연결을 해제하시겠습니까? 로컬 데이터는 유지됩니다.',
};
