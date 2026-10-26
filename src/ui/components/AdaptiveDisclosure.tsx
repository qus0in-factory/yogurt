import { Children, useId, useState, type ReactNode } from 'react'
import { overviewText as text } from '../glossary/overview'
import { typeScale } from '../styles/type-scale'

type Props = {
  title: string
  total: number
  limit: number
  children: ReactNode
  footer?: ReactNode
  className?: string
  listClassName?: string
}

export function AdaptiveDisclosure({ title, total, limit, children, footer, className = '', listClassName = '' }: Props) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const items = Children.toArray(children)
  if (total <= limit) {
    return (
      <section className={className}>
        <h3 className={typeScale.title}>{title} {text.total(total)}</h3>
        <ul className={listClassName}>{items}{footer}</ul>
      </section>
    )
  }
  if (open) {
    return (
      <section className={className}>
        <h3 className={typeScale.title}>{title} {text.total(total)} · {text.expanded}</h3>
        <ul className={listClassName}>{items}{footer}</ul>
      </section>
    )
  }
  return (
    <section className={className}>
      <button
        type="button"
        aria-expanded={false}
        aria-controls={id}
        onClick={() => setOpen(true)}
        className={`flex min-h-11 w-full items-center justify-between gap-2 text-left ${typeScale.title}`}
      >
        <span>{title} {text.total(total)} · {text.collapsed}</span>
        <span className={typeScale.body}>{text.showMore(total - limit)}</span>
      </button>
      <ul id={id} className={listClassName}>{items.slice(0, limit)}</ul>
    </section>
  )
}
