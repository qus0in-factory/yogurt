import { z } from 'zod'

const alias = z.string().trim().min(1, { error: '별칭을 입력하세요' }).max(30, { error: '별칭은 30자 이하로 입력하세요' })
const owner = z.string().trim().min(1, { error: '소유자를 입력하세요' }).max(30, { error: '소유자는 30자 이하로 입력하세요' })

export const accountInputSchema = z.object({
  alias,
  owner,
  accountNumber: z.string().trim().regex(/^[0-9-]{4,30}$/, { error: '계좌번호는 숫자와 하이픈 4~30자로 입력하세요' }),
  accessKey: z.string().trim().min(1, { error: 'Access Key를 입력하세요' }),
  secretKey: z.string().trim().min(1, { error: 'Secret Key를 입력하세요' }),
})

export const accountUpdateSchema = z.object({ alias, owner })

export const accountSchema = z.object({
  id: z.string(),
  alias: z.string(),
  owner: z.string(),
  accountNumber: z.string(),
  createdAt: z.string(),
})

export type AccountInput = z.infer<typeof accountInputSchema>
export type AccountUpdate = z.infer<typeof accountUpdateSchema>
export type Account = z.infer<typeof accountSchema>
