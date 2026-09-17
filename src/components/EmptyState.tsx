import { Settings } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  icon: string
  title: string
  text?: string
  actionLabel?: string
  onAction?: () => void
  children?: ReactNode
}

/** Podpowiedź w pustej aplikacji: czego brakuje i gdzie to dodać. */
export function EmptyState({ icon, title, text, actionLabel = 'Przejdź do ustawień', onAction, children }: Props) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon" aria-hidden="true">{icon}</span>
      <strong>{title}</strong>
      {text && <p>{text}</p>}
      {children}
      {onAction && <button onClick={onAction}><Settings aria-hidden="true" /> {actionLabel}</button>}
    </div>
  )
}
