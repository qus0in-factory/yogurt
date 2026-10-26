import { Hono } from 'hono'
import { assignTargetHandler, listAssignmentsHandler, unassignTargetHandler } from './assignment-handlers.ts'
import { createPortfolioHandler, deletePortfolioHandler, listPortfoliosHandler, updatePortfolioHandler } from './handlers.ts'

export const portfolioRoutes = new Hono<{ Bindings: Env }>()

portfolioRoutes.get('/portfolios', (c) => listPortfoliosHandler(c))
portfolioRoutes.post('/portfolios', (c) => createPortfolioHandler(c))
portfolioRoutes.put('/portfolios/:portfolioId', (c) => updatePortfolioHandler(c))
portfolioRoutes.delete('/portfolios/:portfolioId', (c) => deletePortfolioHandler(c))
portfolioRoutes.get('/portfolio-assignments', (c) => listAssignmentsHandler(c))
portfolioRoutes.put('/accounts/:accountId/products/:productCode/portfolio', (c) => assignTargetHandler(c))
portfolioRoutes.delete('/accounts/:accountId/products/:productCode/portfolio', (c) => unassignTargetHandler(c))
