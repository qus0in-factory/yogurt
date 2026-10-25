import { afterEach, beforeEach, expect, it } from 'vitest'
import { useUiStore } from '../../../src/ui/state/ui-store'
beforeEach(() => {
  localStorage.clear()
  useUiStore.setState(useUiStore.getInitialState())
  useUiStore.persist.clearStorage()
})
afterEach(() => localStorage.clear())
it('기본 탭은 ISA이고 알 수 없는 탭은 첫 탭으로 정규화한다', () => {
  expect(useUiStore.getInitialState().overviewTab).toBe('isa')
  useUiStore.getState().setOverviewTab('unknown' as never)
  expect(useUiStore.getState().overviewTab).toBe('isa')
})
it.each(['isa', 'irp', 'pension'] as const)('선택한 %s 탭을 저장하고 복원한다', async tab => {
  useUiStore.getState().setOverviewTab(tab)
  const saved = localStorage.getItem('yogurt:ui')!
  expect(JSON.parse(saved).state.overviewTab).toBe(tab)
  useUiStore.setState({ overviewTab: 'isa' })
  localStorage.setItem('yogurt:ui', saved)
  await useUiStore.persist.rehydrate()
  expect(useUiStore.getState().overviewTab).toBe(tab)
})
it.each([1, 2])('저장 버전 %s의 알 수 없는 탭도 ISA로 복원한다', async version => {
  localStorage.setItem('yogurt:ui', JSON.stringify({ version, state: { overviewTab: 'unknown' } }))
  await useUiStore.persist.rehydrate()
  expect(useUiStore.getState().overviewTab).toBe('isa')
})
it.each([['irp', 1], ['irp', 2], ['pension', 1], ['pension', 2]] as const)(
  '기존 %s 탭의 저장 버전 %s를 유지한다', async (tab, version) => {
    localStorage.setItem('yogurt:ui', JSON.stringify({ version, state: { overviewTab: tab } }))
    await useUiStore.persist.rehydrate()
    expect(useUiStore.getState().overviewTab).toBe(tab)
  },
)
