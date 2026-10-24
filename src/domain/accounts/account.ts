import { z } from 'zod'

export const accountInputSchema = z.object({
  alias: z.string().trim().min(1).max(30),
  accountNumber: z.string().trim().regex(/^[0-9-]{4,30}$/),
  accessKey: z.string().trim().min(1),
  secretKey: z.string().trim().min(1),
})

export const accountSchema = z.object({
  id: z.string(),
  alias: z.string(),
  accountNumber: z.string(),
  createdAt: z.string(),
})

export type AccountInput = z.infer<typeof accountInputSchema>
export type Account = z.infer<typeof accountSchema>
