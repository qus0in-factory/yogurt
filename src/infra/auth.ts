import type { Context } from 'hono'
import { readSessionCookie, setSessionCookie, clearSessionCookie, SESSION_COOKIE } from './cookies.ts'
import { createSessionToken, isValidSessionSecret, timingSafeEqualStrings, verifySessionToken } from './crypto.ts'

export { SESSION_COOKIE } from './cookies.ts'
export { createSessionToken, isValidSessionSecret, timingSafeEqualStrings, verifySessionToken } from './crypto.ts'
export { clearSessionCookie, readSessionCookie, setSessionCookie } from './cookies.ts'

export function hasLoginPassword(env: Env): boolean {
  return typeof env.LOGIN_PASSWORD === 'string' && env.LOGIN_PASSWORD.length > 0
}

export function hasSessionSecret(env: Env): boolean {
  return typeof env.SESSION_SECRET === 'string' && env.SESSION_SECRET.length > 0
}

export async function loginHandler(c: Context, password: string): Promise<Response> {
  if (!hasLoginPassword(c.env) || !hasSessionSecret(c.env) || !(await isValidSessionSecret(c.env.SESSION_SECRET as string))) {
    return c.json({ error: 'LOGIN_PASSWORD or SESSION_SECRET is not configured' }, 503)
  }
  if (!timingSafeEqualStrings(password, c.env.LOGIN_PASSWORD as string)) {
    return c.json({ error: 'invalid credentials' }, 401)
  }
  const token = await createSessionToken(c.env.SESSION_SECRET as string)
  setSessionCookie(c, token)
  return c.body(null, 204)
}

export async function sessionHandler(c: Context): Promise<Response> {
  const token = readSessionCookie(c)
  if (!token || !(await verifySessionToken(token, c.env.SESSION_SECRET ?? ''))) {
    return c.json({ error: 'unauthorized' }, 401)
  }
  return c.json({ authenticated: true })
}

export async function logoutHandler(c: Context): Promise<Response> {
  clearSessionCookie(c)
  return c.body(null, 204)
}
