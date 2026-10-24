import { z } from 'zod'

export const loginRequestSchema = z.object({
  password: z.string().min(1),
})

export const sessionResponseSchema = z.object({
  authenticated: z.boolean(),
})
