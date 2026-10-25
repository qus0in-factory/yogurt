import type { StockBalance } from '../../../src/app/kis/stock-balance-client'

export const summary: StockBalance['summary'] = {
  cash: 1000, stockEvaluation: 12000, totalEvaluation: 13000, netAssets: 13000,
  purchaseAmount: 10000, evaluationAmount: 12000, profitLoss: 2000,
  assetChange: 2000, assetChangeRate: 20,
}
export const holding: StockBalance['holdings'][number] = {
  code: '069500', name: '삼성전자', quantity: 2, averagePrice: 5000,
  purchaseAmount: 10000, currentPrice: 6000, evaluationAmount: 12000,
  profitLoss: 2000, profitLossRate: 20,
}
export const balance: StockBalance = { summary, holdings: [holding] }
