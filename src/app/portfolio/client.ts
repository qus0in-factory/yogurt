import { portfolioDraftSchema, portfolioSchema, type PortfolioDraft, type Portfolio } from '../../domain/portfolio/portfolio'
import { api } from '../http/http'
import { portfolioRequest } from './errors'

export async function listPortfolios(): Promise<Portfolio[]> {
  return portfolioRequest(async () => portfolioSchema.array().parse(await api.get('portfolios').json()))
}

export async function createPortfolio(input: PortfolioDraft): Promise<Portfolio> {
  const json = portfolioDraftSchema.parse(input)
  return portfolioRequest(async () => portfolioSchema.parse(await api.post('portfolios', { json }).json()))
}

export async function updatePortfolio(id: string, input: PortfolioDraft): Promise<Portfolio> {
  const json = portfolioDraftSchema.parse(input)
  return portfolioRequest(async () => portfolioSchema.parse(
    await api.put(`portfolios/${encodeURIComponent(id)}`, { json }).json(),
  ))
}

export async function deletePortfolio(id: string): Promise<void> {
  await portfolioRequest(async () => { await api.delete(`portfolios/${encodeURIComponent(id)}`) })
}
