import { describe, expect, it, vi } from 'vitest'
import { replaceCredentials } from '../../../src/app/accounts/credentials-client'
import { api } from '../../../src/app/http/http'
vi.mock('../../../src/app/http/http', () => ({ api: { put: vi.fn() } }))

describe('replaceCredentials', () => {
  it('계좌 경로로 trim한 키를 PUT하고 본문을 반환하지 않는다', async () => {
    vi.mocked(api.put).mockResolvedValue(undefined as never)
    await expect(replaceCredentials('a/b', { accessKey: ' AK ', secretKey: ' SK ' })).resolves.toBeUndefined()
    expect(api.put).toHaveBeenCalledWith('accounts/a%2Fb/credentials', { json: { accessKey: 'AK', secretKey: 'SK' } })
  })

  it('빈 키를 거부한다', async () => {
    await expect(replaceCredentials('a', { accessKey: ' ', secretKey: 'SK' })).rejects.toThrow('Access Key를 입력하세요')
    await expect(replaceCredentials('a', { accessKey: 'AK', secretKey: '' })).rejects.toThrow('Secret Key를 입력하세요')
    expect(api.put).not.toHaveBeenCalled()
  })
})
