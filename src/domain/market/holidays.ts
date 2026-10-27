// 2026 public holidays (including substitutes and local election day).
// Source: Korea AeroSpace Administration, 2026 calendar guidelines:
// https://www.kasa.go.kr/prog/plcyBrf/brief/kor/sub01_01_04/view.do?plcyBrfNo=202
// 2026 additions (May 1, July 17): Ministry of Personnel Management:
// https://www.mpm.go.kr/mpm/comm/newsPress/newsPressRelease/?boardId=bbs_0000000000000029&cntId=4250&mode=view
// 확인 필요: KIS 휴장일 조회로 교차 확인 필요. 거래소 연말 휴장·특별 개장 시간은 미반영.
// This list covers 2026 only; subsequent years require an updated calendar.
export const MARKET_HOLIDAYS: string[] = [
  '2026-01-01',
  '2026-02-16', '2026-02-17', '2026-02-18',
  '2026-03-01', '2026-03-02',
  '2026-05-01', '2026-05-05', '2026-05-24', '2026-05-25',
  '2026-06-03', '2026-06-06',
  '2026-07-17',
  '2026-08-15', '2026-08-17',
  '2026-09-24', '2026-09-25', '2026-09-26',
  '2026-10-03', '2026-10-05', '2026-10-09',
  '2026-12-25',
]
