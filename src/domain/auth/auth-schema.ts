import { z } from 'zod'

export const loginRequestSchema = z.object({
  password: z.string().min(1, { error: '비밀번호를 입력하세요' }),
})

export const sessionResponseSchema = z.object({
  authenticated: z.boolean(),
})
