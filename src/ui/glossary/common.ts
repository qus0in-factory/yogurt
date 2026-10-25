export const commonText = {
  pagePosition: (page: number, total: number) => `${total}페이지 중 ${page}페이지`,
  appName: 'YOGURT',
  logout: '로그아웃',
  save: '저장',
  cancel: '취소',
  close: '닫기',
  checking: '확인 중…',
  connectionError: '연결 오류',
  retry: '다시 시도',
  loggedOut: '로그아웃했습니다',
  tryAgainLater: '잠시 후 다시 시도하세요',
  objectParticle: { consonant: '을', vowel: '를' },
} as const
