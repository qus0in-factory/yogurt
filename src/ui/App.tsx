import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { useLogout, useSession } from './auth/useSession'
import { LoginForm } from './auth/LoginForm'
import { Button } from './components/Button'
import { MobileMenu } from './layout/MobileMenu'
import { Sidebar } from './layout/Sidebar'
import { useUiStore } from './store/ui-store'

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
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-primary-50 p-6">
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
    <div className="flex min-h-screen bg-primary-50">
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
            <Button
              variant="outline"
              size="icon"
              aria-label="로그아웃"
              className="md:h-8 md:w-auto md:px-3"
              onClick={() => logoutMutation.mutate(undefined, { onSuccess: () => toast('로그아웃했습니다') })}
            >
              <LogOut aria-hidden="true" className="h-5 w-5 md:hidden" />
              <span className="hidden md:inline">로그아웃</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-semibold text-stone-900">계좌</h1>
          <p className="mt-2 text-stone-600">샘플 데이터</p>
        </main>
      </div>
    </div>
  )
}

export default App
