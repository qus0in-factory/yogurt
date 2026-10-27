export const layoutText = {
  version: (version: string) => `v${version}`,
  menu: '메뉴',
  closeMenu: '메뉴 닫기',
  mainMenu: '주 메뉴',
  appName: 'YOGURT',
  account: '계좌',
  maskMode: '가리기',
  recentVisits: '최근 방문',
  recentAccountsHome: '계좌 홈',
  recentVisitLabel: (title: string, detail?: string) => detail ? `${title} · ${detail}` : title,
} as const
