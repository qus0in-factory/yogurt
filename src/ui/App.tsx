import { useEffect, useState } from 'react'
import { checkSession, logout } from '../app/auth/client'
import { LoginForm } from './auth/LoginForm'
import { Button } from './components/Button'
import { MobileMenu } from './layout/MobileMenu'
import { Sidebar } from './layout/Sidebar'
import type { ScreenId } from './layout/menu'

const TITLES: Record<ScreenId, string> = {
  dashboard: '대시보드',
  accounts: '계좌/자산',
  transactions: '거래',
}

export function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [screen, setScreen] = useState<ScreenId>('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    void checkSession().then(setAuthenticated)
  }, [])

  if (authenticated === null) return null
  if (!authenticated) {
    return <LoginForm onLoginSuccess={() => setAuthenticated(true)} />
  }

  const navigate = (id: ScreenId) => {
    setScreen(id)
    setMobileOpen(false)
  }

  const handleLogout = async () => {
    await logout()
    setAuthenticated(false)
  }

  return (
    <div className="flex min-h-screen bg-stone-50">
      <Sidebar current={screen} onNavigate={navigate} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-stone-200 bg-white p-3">
          <div className="md:hidden">
            <MobileMenu
              open={mobileOpen}
              onToggle={() => setMobileOpen((value) => !value)}
              current={screen}
              onNavigate={navigate}
            />
          </div>
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={handleLogout}>
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
