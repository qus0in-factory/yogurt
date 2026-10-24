import packageJson from '../../package.json'
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import { createMiddleware } from 'hono/factory'
import { isSessionValid, loginHandler, logoutHandler, readSessionCookie, sessionHandler } from './auth/auth.ts'
import { loginRequestSchema } from '../domain/auth/auth-schema.ts'
import { accountInputSchema, accountUpdateSchema } from '../domain/accounts/account.ts'
import { createAccount, listAccounts, updateAccount, deleteAccount } from './accounts/accounts.ts'
import { kisTokenHandler } from './kis/kis-token-handler.ts'

const app = new Hono<{ Bindings: Env }>()

const authMiddleware = createMiddleware(async (c, next) => {
  const path = new URL(c.req.url).pathname
  if (path === '/api/login' || path === '/api/health' || path === '/api/logout') return next()
  const token = readSessionCookie(c)
  if (!token || !(await isSessionValid(c.env, token))) {
    return c.json({ error: 'unauthorized' }, 401)
  }
  await next()
})

app.get('/health', (c) =>
  c.json({ service: 'yogurt', version: packageJson.version, environment: c.env.ENVIRONMENT, status: 'ok' }),
)
app.get('/api/health', (c) =>
  c.json({ service: 'yogurt', version: packageJson.version, environment: c.env.ENVIRONMENT, status: 'ok' }),
)

app.use('/api/*', authMiddleware)
app.post('/api/login', zValidator('json', loginRequestSchema, (result, c) => {
  if (!result.success) return c.json({ error: 'invalid request' }, 400)
}), (c) => loginHandler(c, c.req.valid('json').password))
app.get('/api/session', sessionHandler)
app.post('/api/logout', logoutHandler)
app.get('/api/accounts', listAccounts)
app.post('/api/accounts', zValidator('json', accountInputSchema, (result, c) => {
  if (!result.success) return c.json({ error: 'invalid request' }, 400)
}), (c) => createAccount(c, c.req.valid('json')))
app.patch('/api/accounts/:id', zValidator('json', accountUpdateSchema, (result, c) => {
  if (!result.success) return c.json({ error: 'invalid request' }, 400)
}), (c) => updateAccount(c, c.req.param('id'), c.req.valid('json')))
app.delete('/api/accounts/:id', (c) => deleteAccount(c, c.req.param('id')))
app.post('/api/accounts/:id/kis-token', (c) => kisTokenHandler(c))
app.all('/api/*', (c) => c.notFound())
app.onError((error, c) => {
  if (error instanceof HTTPException && error.status === 400) return c.json({ error: 'invalid request' }, 400)
  throw error
})
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
