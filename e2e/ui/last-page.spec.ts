import { test, expect, openProduct } from '../infra/fixtures'

test('새로고침 후 화면·ISA 탭·선택 계좌를 복원한다', async ({ page }) => {
  await openProduct(page, 'ISA')
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem('yogurt:ui')
    return raw ? JSON.parse(raw).state.selectedProductAccountIds.isa : null
  })).toBe('synthetic')
  await page.reload()
  await expect(page.getByRole('heading', { name: '현황', exact: true })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'ISA', exact: true })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('button', { name: '테스트 합성계좌 00000000' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('region', { name: '잔고 상세', exact: true })).toBeVisible()
  await expect(page.getByRole('img', { name: '월별 목표 진척' })).toBeVisible()
})
