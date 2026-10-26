export type Scenario = { stock: number; cash: number }

export function fixtures({ stock, cash }: Scenario) {
  const total = stock + cash + 2000
  const account = {
    id: 'synthetic', alias: '합성계좌', owner: '테스트', accountNumber: '00000000',
    products: ['01', '22'], createdAt: '2026-01-01T00:00:00Z',
    productPlans: { '01': {
      startDate: '2024-11-01', minTargetAmountWon: 36_000_000, maxTargetAmountWon: 72_000_000,
    } },
  }
  const row = (index: number, amount: number) => ({
    index, purchaseAmount: 0, evaluationAmount: amount, profitLoss: 0,
    creditLoan: 0, netAssets: amount, weight: amount / total * 100,
  })
  const summary = {
    cash, stockEvaluation: stock, totalEvaluation: stock + cash,
    netAssets: total, purchaseAmount: stock, evaluationAmount: stock,
    profitLoss: 0, assetChange: 0, assetChangeRate: 0,
  }
  const balance = { summary, holdings: stock ? [{
    code: 'SYNTH', name: '합성 장기투자 한국어 이름 종목', quantity: 2,
    averagePrice: stock / 2, purchaseAmount: stock, currentPrice: stock / 2,
    evaluationAmount: stock, profitLoss: 0, profitLossRate: 0,
  }] : [] }
  const assets = (code: string) => ({
    rows: [row(0, stock), row(code === '22' ? 1 : 7, 2000),
      row(code === '22' ? 8 : 17, cash), row(99, total)],
    summary: {
      totalAssets: total, netAssets: total, evaluationAmount: total, purchaseAmount: total,
      profitLoss: 0, loanAmount: 0, deposit: cash, totalDeposit: cash,
      cmaEvaluation: 0, foreignEvaluation: 0,
    },
  })
  return { account, assets, balance }
}
