import { useLogout, useSession } from './auth/useSession'
import { LoginForm } from './auth/LoginForm'
import { Button } from './components/Button'
import { MobileMenu } from './layout/MobileMenu'
import { Sidebar } from './layout/Sidebar'
import type { ScreenId } from './layout/menu'
import { useUiStore } from './store/ui-store'

const TITLES: Record<ScreenId, string> = {
  dashboard: '대시보드',
  accounts: '계좌/자산',
  transactions: '거래',
}

export function App() {
  const session = useSession()
  const logoutMutation = useLogout()
  const screen = useUiStore((state) => state.screen)
  const drawerOpen = useUiStore((state) => state.drawerOpen)
  const navigate = useUiStore((state) => state.navigate)
  const setDrawerOpen = useUiStore((state) => state.setDrawerOpen)

  if (session.isPending) {
    return <p className="p-6 text-stone-600">확인 중…</p>
  }

  if (session.isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-stone-50 p-6">
        <p role="alert" className="text-stone-900">연결 오류</p>
        <Button variant="outline" onClick={() => void session.refetch()}>
          다시 시도
        </Button>
      </div>
    )
  }

  if (!session.data) {
    return <LoginForm onLoginSuccess={() => {}} />
  }

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar current={screen} onNavigate={navigate} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-stone-200 bg-white p-3">
          <div className="md:hidden">
            <MobileMenu
              open={drawerOpen}
              onToggle={() => setDrawerOpen(!drawerOpen)}
              current={screen}
              onNavigate={navigate}
            />
          </div>
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()}>
              로그아웃
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-semibold text-stone-900">{TITLES[screen]}</h1>
          <p className="mt-2 text-stone-600">샘플 데이터</p>
        </main>
      </div>
    </div>
  )
}

export default App
