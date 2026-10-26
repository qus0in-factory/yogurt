export function wonToManwon(won: number): number {
  return won / 10_000
}

export function manwonToWon(manwon: number): number {
  return manwon * 10_000
}

export function roundWonToManwon(won: number): number {
  return Math.round(wonToManwon(won))
}
