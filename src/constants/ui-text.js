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
};
