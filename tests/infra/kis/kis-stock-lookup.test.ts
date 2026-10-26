// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { KisStockNotFoundError, lookupStockName } from '../../../src/infra/kis/kis-stock-lookup.ts'

afterEach(() => {
  vi.restoreAllMocks()
})

const mockClient = (body: unknown, status = 200) => ({
  request: vi.fn(async () => new Response(JSON.stringify(body), { status })),
})

describe('lookupStockName 상품기본조회(search-stock-info) 및 404 진단 로그', () => {
  it('search-stock-info 경로·trId(CTPF1002R)·PDNO·PRDT_TYPE_CD=300으로 요청하고 prdt_abrv_name을 우선 반환한다', async () => {
    const client = mockClient({
      rt_cd: '0',
      output: { prdt_abrv_name: '  삼성전자  ', prdt_name: '삼성전자보통주' },
    })
    await expect(lookupStockName(client, '005930')).resolves.toBe('삼성전자')
    expect(client.request).toHaveBeenCalledWith('/uapi/domestic-stock/v1/quotations/search-stock-info', {
      method: 'GET',
      trId: 'CTPF1002R',
      query: { PDNO: '005930', PRDT_TYPE_CD: '300' },
    })
  })

  it('prdt_abrv_name이 비어 있으면 prdt_name으로 폴백한다', async () => {
    const client = mockClient({
      rt_cd: '0',
      output: { prdt_abrv_name: '   ', prdt_name: '  TIGER 미국S&P500  ' },
    })
    await expect(lookupStockName(client, '360750')).resolves.toBe('TIGER 미국S&P500')
  })

  it('rt_cd !== "0" 시 {reason:"rt_cd", rt_cd, msg_cd, msg1}만 warn 로그로 남기고 비밀·본문 값을 넣지 않는다', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const client = mockClient({
      rt_cd: '1', msg_cd: 'EGW00123', msg1: '조회 실패',
      secretLeak: 'PROTECT-TOKEN-12345678',
      output: { prdt_abrv_name: '숨겨진값', account: '12345678' },
    })
    await expect(lookupStockName(client, '005930')).rejects.toBeInstanceOf(KisStockNotFoundError)
    expect(warnSpy).toHaveBeenCalledWith({ reason: 'rt_cd', rt_cd: '1', msg_cd: 'EGW00123', msg1: '조회 실패' })
    const serialized = JSON.stringify(warnSpy.mock.calls[0])
    expect(serialized).not.toContain('PROTECT-TOKEN')
    expect(serialized).not.toContain('12345678')
    expect(serialized).not.toContain('숨겨진값')
  })

  it('prdt_abrv_name과 prdt_name이 모두 비어 404가 될 때 {reason:"empty_name", outputKeys}만 warn 로그로 남긴다', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const client = mockClient({
      rt_cd: '0',
      output: { pdno: '005935', prdt_eng_name: 'SAMSUNG ELEC PREF', secret_val: 'PROTECT-SECRET-87654321' },
    })
    await expect(lookupStockName(client, '005935')).rejects.toBeInstanceOf(KisStockNotFoundError)
    expect(warnSpy).toHaveBeenCalledWith({ reason: 'empty_name', outputKeys: ['pdno', 'prdt_eng_name', 'secret_val'] })
    const serialized = JSON.stringify(warnSpy.mock.calls[0])
    expect(serialized).not.toContain('SAMSUNG ELEC PREF')
    expect(serialized).not.toContain('PROTECT-SECRET')
    expect(serialized).not.toContain('87654321')
  })
})
