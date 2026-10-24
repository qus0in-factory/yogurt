import { getCookie, setCookie } from 'hono/cookie'
import type { Context } from 'hono'

export const SESSION_COOKIE = 'session'

const isHttps = (c: Context) => new URL(c.req.url).protocol === 'https:'

export function setSessionCookie(c: Context, token: string): void {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isHttps(c),
    sameSite: 'Strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })
}

export function clearSessionCookie(c: Context): void {
  setCookie(c, SESSION_COOKIE, '', {
    httpOnly: true,
    secure: isHttps(c),
    sameSite: 'Strict',
    path: '/',
    maxAge: 0,
  })
}

export function readSessionCookie(c: Context): string | undefined {
  return getCookie(c, SESSION_COOKIE)
}
