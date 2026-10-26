export function clampTooltipPosition(centerX: number, tooltipWidth: number, viewportWidth: number, padding = 8): number {
  const half = tooltipWidth / 2
  const min = padding + half
  const max = Math.max(min, viewportWidth - padding - half)
  return Math.min(Math.max(centerX, min), max)
}
