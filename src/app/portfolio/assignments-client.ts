import { portfolioAssignmentRequestSchema, portfolioAssignmentSchema, type PortfolioAssignment } from '../../domain/portfolio/assignment'
import { api } from '../http/http'
import { portfolioRequest } from './errors'

const productPath = (accountId: string, productCode: string) =>
  `accounts/${encodeURIComponent(accountId)}/products/${encodeURIComponent(productCode)}/portfolio`

export async function listPortfolioAssignments(): Promise<PortfolioAssignment[]> {
  return portfolioRequest(async () => portfolioAssignmentSchema.array().parse(
    await api.get('portfolio-assignments').json(),
  ))
}

export async function setPortfolioAssignment(accountId: string, productCode: string, portfolioId: string): Promise<PortfolioAssignment> {
  const json = portfolioAssignmentRequestSchema.parse({ portfolioId })
  return portfolioRequest(async () => portfolioAssignmentSchema.parse(
    await api.put(productPath(accountId, productCode), { json }).json(),
  ))
}

export async function clearPortfolioAssignment(accountId: string, productCode: string): Promise<void> {
  await portfolioRequest(async () => { await api.delete(productPath(accountId, productCode)) })
}
