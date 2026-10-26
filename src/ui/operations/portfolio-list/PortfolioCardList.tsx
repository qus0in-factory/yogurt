import type { PortfolioAssignment } from '../../../domain/portfolio/assignment'
import type { Portfolio } from '../../../domain/portfolio/portfolio'
import { Carousel } from '../../components/Carousel'
import { portfolioListText } from '../../glossary/portfolio-list'
import type { AdaptiveWidth } from '../../lib/useAdaptiveWidth'
import { PortfolioCard } from './PortfolioCard'

const labels = {
  list: portfolioListText.listLabel,
  previous: portfolioListText.previous,
  next: portfolioListText.next,
  goTo: portfolioListText.goTo,
  position: portfolioListText.position,
}

type Props = {
  width: AdaptiveWidth
  portfolios: Portfolio[]
  assignments: PortfolioAssignment[]
  onDuplicate: (portfolio: Portfolio) => void
  onEdit: (portfolio: Portfolio) => void
  onDelete: (portfolio: Portfolio) => void
}

export function PortfolioCardList({ width, portfolios, assignments, onDuplicate, onEdit, onDelete }: Props) {
  const card = (item: Portfolio) => (
    <PortfolioCard
      key={item.id}
      portfolio={item}
      assignedCount={assignments.filter((row) => row.portfolioId === item.id).length}
      onDuplicate={onDuplicate}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
  if (width === 'desktop') {
    return (
      <div data-testid="portfolio-card-grid" className="grid grid-cols-2 gap-4">
        {portfolios.map(card)}
      </div>
    )
  }
  return <Carousel items={portfolios} labels={labels} renderItem={card} />
}
