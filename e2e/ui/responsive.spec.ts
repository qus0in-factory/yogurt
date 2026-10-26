import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { test, expect, openProduct } from '../infra/fixtures'

test('반응형 차트·비중 바·한국어 라벨을 캡처한다 @shots', async ({ page }) => {
  await openProduct(page, 'ISA')
  await mkdir(resolve('e2e/artifacts'), { recursive: true })
  for (const width of [1440, 390, 375]) {
    await page.setViewportSize({ width, height: width > 768 ? 900 : 844 })
    await expect(page.getByTestId('month-tick')).toHaveCount(width > 768 ? 7 : 3)
    await expect(page.getByRole('img', { name: '월별 목표 진척' })).toBeVisible()
    expect(await page.locator('html').evaluate(el => el.scrollWidth <= window.innerWidth)).toBe(true)
    await expect(page.locator('main').locator('..').locator('..')).toHaveCSS('word-break', 'keep-all')
    const bars = page.getByTestId('holding-weight')
    await expect(bars.first()).toBeVisible()
    for (const bar of await bars.all()) {
      const box = await bar.boundingBox()
      expect(box && box.x >= 0 && box.x + box.width <= width).toBeTruthy()
    }
    await expect(page.getByText('합성 장기투자 한국어 이름 종목')).toBeVisible()
    await page.screenshot({ path: resolve(`e2e/artifacts/overview-${width}.png`), fullPage: true })
  }
})
