import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'
import { loginHandler, logoutHandler, readSessionCookie, sessionHandler, verifySessionToken } from './auth.ts'

const app = new Hono<{ Bindings: Env }>()

const authMiddleware = createMiddleware(async (c, next) => {
  const path = new URL(c.req.url).pathname
  if (path === '/api/login' || path === '/api/health' || path === '/api/logout') return next()
  const token = readSessionCookie(c)
  if (!token || !(await verifySessionToken(token, c.env.SESSION_SECRET ?? ''))) {
    return c.json({ error: 'unauthorized' }, 401)
  }
  await next()
})

app.get('/health', (c) =>
  c.json({ service: 'yogurt', environment: c.env.ENVIRONMENT, status: 'ok' }),
)
app.get('/api/health', (c) =>
  c.json({ service: 'yogurt', environment: c.env.ENVIRONMENT, status: 'ok' }),
)

app.use('/api/*', authMiddleware)
app.post('/api/login', loginHandler)
app.get('/api/session', sessionHandler)
app.post('/api/logout', logoutHandler)
app.all('/api/*', (c) => c.notFound())
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))

export default app
