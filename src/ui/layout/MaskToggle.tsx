import { Eye, EyeOff } from 'lucide-react'
import { Button } from '../components/Button'
import { layoutText } from '../glossary/layout'
import { useMaskStore } from '../state/mask-store'

export function MaskToggle() {
  const masked = useMaskStore((s) => s.masked)
  const toggleMask = useMaskStore((s) => s.toggleMask)
  const Icon = masked ? EyeOff : Eye

  return (
    <Button
      type="button"
      variant={masked ? 'default' : 'outline'}
      size="icon"
      aria-pressed={masked}
      aria-label={layoutText.maskMode}
      className="md:h-8 md:w-auto md:px-3"
      onClick={toggleMask}
    >
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span className="hidden md:inline">{layoutText.maskMode}</span>
    </Button>
  )
}
