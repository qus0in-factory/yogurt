import { type FormEvent, useState } from 'react'
import { Button } from '../components/Button'
import { useLogin } from './useSession'

interface LoginFormProps {
  onLoginSuccess: () => void
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const loginMutation = useLogin()
  const loading = loginMutation.isPending

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError(null)
    loginMutation.mutate(password, {
      onSuccess: (ok) => {
        if (ok) onLoginSuccess()
        else setError('비밀번호가 올바르지 않습니다.')
      },
      onError: () => setError('로그인에 실패했습니다.'),
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-sm rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-stone-900">로그인</h1>
        <p className="mt-1 text-sm text-stone-600">서비스 이용을 위해 비밀번호를 입력해 주세요.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-stone-700">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 placeholder-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
              required
            />
          </div>
          {error && (
            <p role="alert" className="text-sm font-medium text-rose-600">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </div>
    </div>
  )
}
