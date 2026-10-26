import { test, expect, openProduct } from '../infra/fixtures'

for (const scenario of [{ stock: 0, cash: 1000 }, { stock: 12000, cash: 0 }]) {
  test.describe(`연금저축 주식 ${scenario.stock} 예수금 ${scenario.cash}`, () => {
    test.use({ scenario })
    test('0원 자산 행과 보유 항목만 숨긴다', async ({ page }) => {
      await openProduct(page, '연금저축')
      const assets = page.getByRole('region', { name: '투자자산 현황' })
      const holdings = page.getByRole('region', { name: '예수금·주식' })
      await expect(assets.getByText('주식', { exact: true })).toHaveCount(scenario.stock ? 1 : 0)
      await expect(assets.getByText('현금/예수금', { exact: true })).toHaveCount(scenario.cash ? 1 : 0)
      await expect(assets.getByText('펀드', { exact: true })).toBeVisible()
      await expect(holdings.getByText('합성 장기투자 한국어 이름 종목')).toHaveCount(scenario.stock ? 1 : 0)
      await expect(holdings.getByText('현금/예수금/RP')).toHaveCount(scenario.cash ? 1 : 0)
    })
  })
}
