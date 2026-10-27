import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { marketText } from '../../glossary/market'
export function UnknownOrderActions({ onClear }: { onClear: () => void }) {
  const [open, setOpen] = useState(false)
  const t = marketText.unknownRecord
  return <>
    <Button variant="ghost" size="icon" title={t.clear} aria-label={t.clear} onClick={() => setOpen(true)}><Trash2 aria-hidden="true" className="h-4 w-4" /></Button>
    <Dialog open={open} onClose={() => setOpen(false)} title={t.clear}>
      <p>{t.confirm}</p>
      <Button onClick={() => { onClear(); setOpen(false) }}>{t.confirmClear}</Button>
    </Dialog>
  </>
}
