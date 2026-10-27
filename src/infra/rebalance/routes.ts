import { Hono } from 'hono'
import { getKeepAmountHandler, saveKeepAmountHandler } from './keep-amount-handlers.ts'

export const keepAmountRoutes = new Hono<{ Bindings: Env }>()

keepAmountRoutes.get('/accounts/:accountId/products/:productCode/rebalance-keep-amount', getKeepAmountHandler)
keepAmountRoutes.put('/accounts/:accountId/products/:productCode/rebalance-keep-amount', saveKeepAmountHandler)
