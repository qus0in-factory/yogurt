import type { Page } from '@playwright/test'
import { fixtures, type Scenario } from './data'

export async function installRoutes(page: Page, scenario: Scenario) {
  const data = fixtures(scenario)
  const unexpected: string[] = []
  await page.route('**/*', async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.origin !== 'http://127.0.0.1:4173') {
      unexpected.push('외부 요청 차단'); return route.abort('blockedbyclient')
    }
    const path = url.pathname
    if (!path.startsWith('/api/')) return route.continue()
    const method = request.method()
    if (['/api/session', '/api/login', '/api/logout'].includes(path)) return route.continue()
    const json = (value: unknown) => route.fulfill({ status: 200, json: value })
    if (method === 'GET' && path === '/api/accounts') return json([data.account])
    if (method === 'GET' && path === '/api/kis/status') {
      return route.fulfill({ contentType: 'text/event-stream', body: 'event: status\ndata: {"accountId":"synthetic","status":"connected","expiresAt":1793000000000}\n\n' })
    }
    const match = /^\/api\/accounts\/synthetic\/products\/(01|22)\/(assets|balance|plan)$/.exec(path)
    if (match && method === 'GET' && match[2] !== 'plan') {
      return json(match[2] === 'assets' ? data.assets(match[1]) : data.balance)
    }
    if (match?.[1] === '01' && match[2] === 'plan' && method === 'PUT') {
      data.account.productPlans['01'] = request.postDataJSON()
      return json(data.account)
    }
    unexpected.push(`${method} ${path}`)
    await route.fulfill({ status: 501, json: { error: '미등록 E2E API' } })
  })
  return unexpected
}
