export async function checkSession(): Promise<boolean> {
  const res = await fetch('/api/session')
  return res.ok
}

export async function login(password: string): Promise<boolean> {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  return res.ok
}

export async function logout(): Promise<void> {
  await fetch('/api/logout', { method: 'POST' })
}
