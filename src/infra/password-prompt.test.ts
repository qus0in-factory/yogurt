import { describe, expect, it, vi } from 'vitest'
import { promptPasswordPair } from './password-prompt.ts'

describe('hidden password prompt', () => {
  it('두 값을 숨김 입력으로 받고 터미널에 값은 쓰지 않는다', async () => {
    const listeners: Array<(chunk: Buffer | string) => void> = []
    const input = {
      isTTY: true, setRawMode: vi.fn(), resume: vi.fn(), pause: vi.fn(),
      on: vi.fn((_event, listener) => listeners.push(listener)), off: vi.fn(),
    } as any
    const output = { write: vi.fn() } as any
    const pending = promptPasswordPair(input, output)
    listeners[0](Buffer.from('pwx\x7f\r'))
    await vi.waitFor(() => expect(listeners).toHaveLength(2))
    listeners[1](Buffer.from('pw\r'))
    expect(await pending).toEqual({ password: 'pw', confirmation: 'pw' })
    expect(output.write.mock.calls.flat().join('')).not.toContain('pw')
    expect(input.setRawMode.mock.calls).toEqual([[true], [false], [true], [false]])
    expect(input.pause).toHaveBeenCalledTimes(2)
  })

  it('TTY가 없으면 입력을 읽지 않는다', async () => {
    await expect(promptPasswordPair({ isTTY: false } as any, { write: vi.fn() } as any))
      .rejects.toThrow('Interactive terminal required')
  })
})
