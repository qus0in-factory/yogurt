import packageJson from '../../package.json'
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import { createMiddleware } from 'hono/factory'
import { isSessionValid, loginHandler, logoutHandler, readSessionCookie, sessionHandler } from './auth/auth.ts'
import { loginRequestSchema } from '../domain/auth/auth-schema.ts'
import { accountInputSchema, accountUpdateSchema, accountOrderSchema } from '../domain/accounts/account.ts'
import { productPlanRequestSchema } from '../domain/accounts/product-plan.ts'
import { accountProductSchema, productCodeSchema } from '../domain/accounts/products.ts'
import { replaceCredentials } from './accounts/credentials-handler.ts'
import { isaLastCloseHandler } from './accounts/isa-last-close.ts'
import { createAccount, listAccounts, updateAccount, deleteAccount, setAccountProduct, reorderAccounts, setAccountProductPlan } from './accounts/accounts.ts'
import { kisTokenHandler } from './kis/kis-token-handler.ts'
import { kisBalanceHandler } from './kis/kis-balance-handler.ts'
import { kisAssetsHandler } from './kis/kis-assets-handler.ts'
import { kisStatusStream } from './kis/kis-status-stream.ts'
import { getRiskClassesHandler, setRiskClassHandler } from './holdings/risk-class-handlers.ts'
import { runIsaMonthlySnapshots } from './snapshots/run-isa-monthly-snapshots.ts'
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
app.get('/api/accounts/:accountId/isa-last-close', isaLastCloseHandler)
app.post('/api/accounts', zValidator('json', accountInputSchema, (result, c) => {
  if (!result.success) return c.json({ error: 'invalid request' }, 400)
}), (c) => createAccount(c, c.req.valid('json')))
app.put('/api/accounts/order', zValidator('json', accountOrderSchema, (result, c) => {
  if (!result.success) return c.json({ error: 'invalid request' }, 400)
}), (c) => reorderAccounts(c, c.req.valid('json')))
app.patch('/api/accounts/:id', zValidator('json', accountUpdateSchema, (result, c) => {
  if (!result.success) return c.json({ error: 'invalid request' }, 400)
}), (c) => updateAccount(c, c.req.param('id'), c.req.valid('json')))
app.delete('/api/accounts/:id', (c) => deleteAccount(c, c.req.param('id')))
app.put('/api/accounts/:id/credentials', replaceCredentials)
app.put('/api/accounts/:id/products/:code', zValidator('json', accountProductSchema, (result, c) => {
  if (!result.success) return c.json({ error: 'invalid request' }, 400)
}) as any, (async (c: any) => {
  const code = c.req.param('code') as string
  if (!productCodeSchema.safeParse(code).success) return c.json({ error: 'invalid request' }, 400)
  return setAccountProduct(c, c.req.param('id') as string, code, c.req.valid('json'))
}) as any)
app.put('/api/accounts/:id/products/:code/plan', zValidator('json', productPlanRequestSchema, (result, c) => {
  if (!result.success) return c.json({ error: 'invalid request' }, 400)
}), c => setAccountProductPlan(c, c.req.param('id'), c.req.param('code'), c.req.valid('json')))
app.post('/api/accounts/:id/kis-token', (c) => kisTokenHandler(c))
app.get('/api/kis/status', (c) => kisStatusStream(c))
app.get('/api/accounts/:id/products/:code/balance', (c) => kisBalanceHandler(c))
app.get('/api/accounts/:id/products/:code/assets', (c) => kisAssetsHandler(c))
app.get('/api/accounts/:id/products/:code/risk-classes', getRiskClassesHandler)
app.put('/api/accounts/:id/products/:code/risk-classes/:stockCode', setRiskClassHandler)
app.all('/api/*', (c) => c.notFound())
app.onError((error, c) => {
  if (error instanceof HTTPException && error.status === 400) return c.json({ error: 'invalid request' }, 400)
  throw error
})
app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw))
export default { fetch: app.fetch, scheduled: (_event: ScheduledController, env: Env, ctx: ExecutionContext) => ctx.waitUntil(runIsaMonthlySnapshots(env)) }
