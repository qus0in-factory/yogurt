type SecretSetupTarget = 'dev' | 'main'
type ResolvedTarget = { target: SecretSetupTarget; env: 'dev' | 'production' }

export function resolveTargets(arg: string | undefined): ResolvedTarget[] | null {
  const value = arg?.trim()
  if (value === undefined) return [{ target: 'dev', env: 'dev' }, { target: 'main', env: 'production' }]
  if (value === 'dev') return [{ target: 'dev', env: 'dev' }]
  if (value === 'main') return [{ target: 'main', env: 'production' }]
  return null
}

export function validateLoginPassword(value: string | undefined, confirmation?: string): string | null {
  if (value === undefined || value.trim() === '') return 'LOGIN_PASSWORD is required'
  if (confirmation !== undefined && value !== confirmation) return 'LOGIN_PASSWORD entries do not match'
  return null
}

export function createBulkPayload(loginPassword: string, sessionSecret: string): string {
  return JSON.stringify({ LOGIN_PASSWORD: loginPassword, SESSION_SECRET: sessionSecret })
}
