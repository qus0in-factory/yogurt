import { test as base, expect, type Page } from '@playwright/test'
import { installRoutes } from './routes'
import { loginPassword } from './credentials'
import type { Scenario } from './data'

export const test = base.extend<{ scenario: Scenario; isolated: void }>({
  scenario: [{ stock: 12000, cash: 1000 }, { option: true }],
  isolated: [async ({ page, scenario }, use) => {
    await page.clock.setFixedTime(new Date('2026-10-25T03:00:00Z'))
    const unexpected = await installRoutes(page, scenario)
    try {
      const response = await page.request.post('http://127.0.0.1:4173/api/login', {
        data: { password: loginPassword() }, maxRedirects: 0,
      })
      if (response.status() !== 204) throw new Error('login failed')
    } catch {
      throw new Error('E2E 로컬 로그인 실패: Worker 설정과 .env.e2e.local을 확인하세요.')
    }
    await use()
    expect(unexpected, '등록되지 않은 API 또는 외부 요청이 발생했습니다').toEqual([])
  }, { auto: true }],
})
export { expect }

export async function openProduct(page: Page, product: 'ISA' | '연금저축') {
  await page.goto('/')
  await expect(page.getByRole('button', { name: '로그아웃', exact: true })).toBeVisible()
  if (!await page.getByRole('heading', { name: '현황', exact: true }).isVisible()) {
    const menu = page.getByRole('button', { name: '메뉴', exact: true })
    if (await menu.isVisible()) await menu.click()
    await page.getByRole('button', { name: '현황', exact: true }).click()
  }
  await page.getByRole('tab', { name: product, exact: true }).click()
  await page.getByRole('button', { name: '테스트 합성계좌 00000000', exact: true }).click()
  await expect(page.getByRole('region', { name: '잔고 상세', exact: true })).toBeVisible()
}
