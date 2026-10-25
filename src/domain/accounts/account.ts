import { z } from 'zod'
import { accountCredentialsSchema } from './credentials'
import { productPlanSchema } from './product-plan'
import type { accountProductSchema } from './products'

const alias = z.string().trim().min(1, { error: '별칭을 입력하세요' }).max(8, { error: '별칭은 8자 이하로 입력하세요' })
const owner = z.string().trim().min(1, { error: '소유자를 입력하세요' }).max(8, { error: '소유자는 8자 이하로 입력하세요' })

export const accountInputSchema = z.object({
  alias,
  owner,
  accountNumber: z.string().trim().regex(/^[0-9]{8}$/, { error: '계좌번호는 숫자 8자리로 입력하세요' }),
  ...accountCredentialsSchema.shape,
})

export const accountOrderSchema = z.object({ ids: z.array(z.string()).min(1) })

export const accountUpdateSchema = z.object({ alias, owner })

export const accountSchema = z.object({
  id: z.string(),
  alias: z.string(),
  owner: z.string(),
  accountNumber: z.string(),
  products: z.array(z.string()),
  productPlans: z.record(z.string(), productPlanSchema),
  createdAt: z.string(),
})

export type AccountInput = z.infer<typeof accountInputSchema>
export type AccountUpdate = z.infer<typeof accountUpdateSchema>
export type Account = z.infer<typeof accountSchema>
export type AccountProduct = z.infer<typeof accountProductSchema>
