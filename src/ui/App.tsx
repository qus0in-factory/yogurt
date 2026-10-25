import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { useLogout, useSession } from './auth/useSession'
import { LoginForm } from './auth/LoginForm'
import { Button } from './components/Button'
import { MobileMenu } from './layout/MobileMenu'
import { Sidebar } from './layout/Sidebar'
import { AccountsPage } from './accounts/AccountsPage'
import { OverviewPage } from './overview/OverviewPage'
import { useUiStore } from './state/ui-store'
import { commonText } from './glossary'
import { cn } from './lib/cn'
import { spacing, typeScale } from './styles/type-scale'

export function App() {
  const session = useSession()
  const logoutMutation = useLogout()
  const screen = useUiStore((state) => state.screen)
  const active = screen === 'overview' ? 'overview' : 'accounts'
  const drawerOpen = useUiStore((state) => state.drawerOpen)
  const navigate = useUiStore((state) => state.navigate)
  const setDrawerOpen = useUiStore((state) => state.setDrawerOpen)

  if (session.isPending) {
    return <p className={cn(spacing.page, typeScale.body)}>{commonText.checking}</p>
  }

  if (session.isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-primary-50 p-6">
        <p role="alert" className={typeScale.body}>{commonText.connectionError}</p>
        <Button variant="outline" onClick={() => void session.refetch()}>
          {commonText.retry}
        </Button>
      </div>
    )
  }

  if (!session.data) {
    return <LoginForm onLoginSuccess={() => {}} />
  }

  return (
    <div className="flex min-h-screen bg-primary-50">
      <Sidebar current={active} onNavigate={navigate} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-stone-200 bg-white p-4">
          <div className="md:hidden">
            <MobileMenu
              open={drawerOpen}
              onToggle={() => setDrawerOpen(!drawerOpen)}
              current={active}
              onNavigate={navigate}
            />
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="icon"
              aria-label={commonText.logout}
              className="md:h-8 md:w-auto md:px-3"
              onClick={() => logoutMutation.mutate(undefined, { onSuccess: () => toast(commonText.loggedOut) })}
            >
              <LogOut aria-hidden="true" className="h-5 w-5 md:hidden" />
              <span className="hidden md:inline">{commonText.logout}</span>
            </Button>
          </div>
        </header>
        <main className={cn('flex-1', spacing.page)}>
          {active === 'overview' ? <OverviewPage /> : <AccountsPage />}
        </main>
      </div>
    </div>
  )
}

export default App
