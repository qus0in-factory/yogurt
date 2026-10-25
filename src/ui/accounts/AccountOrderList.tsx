import { useState } from 'react'
import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { Account } from '../../domain/accounts/account'
import { Button } from '../components/Button'
import { accountsText } from '../glossary/accounts'
import { spacing, typeScale } from '../styles/type-scale'

function SortableAccount({ account, onMove }: { account: Account; onMove: (id: string, delta: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: account.id })
  return <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-3">
    <button type="button" aria-label={accountsText.reorderHandle(account.alias)} className="touch-none cursor-grab rounded p-2" {...attributes} {...listeners} onKeyDown={(event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); onMove(account.id, event.key === 'ArrowDown' ? 1 : -1) }
    }}><GripVertical aria-hidden="true" className="h-5 w-5" /></button>
    <div className={spacing.stack}><span className={typeScale.caption}>{account.owner}</span><span className={typeScale.cardTitle}>{account.alias}</span><span className={typeScale.number}>{account.accountNumber}</span></div>
  </li>
}

export function AccountOrderList({ accounts, onDone, onCancel }: {
  accounts: Account[]; onDone: (ids: string[]) => void; onCancel: () => void
}) {
  const [items, setItems] = useState(accounts)
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor))
  const move = (id: string, delta: number) => setItems((current) => {
    const from = current.findIndex((item) => item.id === id)
    const to = from + delta
    return from < 0 || to < 0 || to >= current.length ? current : arrayMove(current, from, to)
  })
  const end = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) setItems((current) => arrayMove(current, current.findIndex((item) => item.id === active.id), current.findIndex((item) => item.id === over.id)))
  }
  return <div className={spacing.stack}><DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={end}><SortableContext items={items.map(({ id }) => id)} strategy={verticalListSortingStrategy}><ul className={spacing.stack}>{items.map((account) => <SortableAccount key={account.id} account={account} onMove={move} />)}</ul></SortableContext></DndContext>
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={onCancel}>{accountsText.reorderCancel}</Button><Button onClick={() => onDone(items.map(({ id }) => id))}>{accountsText.reorderDone}</Button></div>
  </div>
}
