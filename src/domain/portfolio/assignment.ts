import { z } from 'zod'

export const portfolioProductCodeSchema = z.enum(['01', '22'])

export type PortfolioProductCode = z.infer<typeof portfolioProductCodeSchema>

export const portfolioAssignmentRequestSchema = z.object({
  portfolioId: z.string().trim().min(1, { error: 'REQUIRED' }),
}).strict()

export const portfolioAssignmentSchema = z.object({
  accountId: z.string().min(1, { error: 'REQUIRED' }),
  productCode: portfolioProductCodeSchema,
  portfolioId: z.string().min(1, { error: 'REQUIRED' }),
}).strict()

export type PortfolioAssignment = z.infer<typeof portfolioAssignmentSchema>
