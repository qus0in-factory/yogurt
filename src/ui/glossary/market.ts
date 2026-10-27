export const marketText = {
  unknownRecord: { notAccepted: '접수되지 않은 주문 기록을 지웠습니다', pastDay: '지난 거래일 주문 기록을 정리했습니다', clear: '주문 기록 지우기', confirm: 'KIS에서 이 주문이 없거나 끝난 것을 확인했습니까?', confirmClear: '기록만 지우기' },
  checkFailed: '장 상태를 확인할 수 없습니다',
  unknownOrder: '주문 상태를 알 수 없습니다. 같은 화면에서 같은 요청으로만 확인하세요.',
  needsConfirmation: '주문 결과 확인 필요',
  noticeShort: { closed: '마감', error: '확인' },
  reasons: {
    'closed-hours': '장 마감 시간',
    weekend: '주말',
    holiday: '휴장일',
  } as Record<string, string>,
  notice: (reason: string, nextOpenAt?: string) =>
    nextOpenAt
      ? `장 마감 (${reason}) · 다음 개장 시각: ${nextOpenAt} (한국 시간)`
      : `장 마감 (${reason})`,
  dialogClosed: (reason: string, nextOpenAt?: string) =>
    nextOpenAt
      ? `장 마감 (${reason}) · 다음 개장 시각: ${nextOpenAt} (한국 시간)`
      : `장 마감 (${reason})으로 주문할 수 없습니다.`,
} as const
