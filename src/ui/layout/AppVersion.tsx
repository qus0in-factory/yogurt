import { layoutText } from '../glossary/layout'
import { typeScale } from '../styles/type-scale'

export function AppVersion() {
  return (
    <p className={`mx-2 mt-auto px-3 py-3 tabular-nums ${typeScale.caption}`}>
      {layoutText.version(import.meta.env.VITE_APP_VERSION)}
    </p>
  )
}
