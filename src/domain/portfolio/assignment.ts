import { z } from 'zod'
import { productCodeSchema } from '../accounts/products.ts'

export const portfolioAssignmentRequestSchema = z.object({
  portfolioId: z.string().trim().min(1, { error: 'REQUIRED' }),
}).strict()

export const portfolioAssignmentSchema = z.object({
  accountId: z.string().min(1, { error: 'REQUIRED' }),
  productCode: productCodeSchema,
  portfolioId: z.string().min(1, { error: 'REQUIRED' }),
}).strict()

export type PortfolioAssignment = z.infer<typeof portfolioAssignmentSchema>
