import { z } from 'zod'

export const accountCredentialsSchema = z.object({
  accessKey: z.string().trim().min(1, { error: 'Access Key를 입력하세요' }),
  secretKey: z.string().trim().min(1, { error: 'Secret Key를 입력하세요' }),
})

export type AccountCredentials = z.infer<typeof accountCredentialsSchema>
