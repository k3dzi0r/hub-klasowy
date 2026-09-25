import { ArrowRight } from 'lucide-react'
import type { ScheduleItem } from '../types'

type NowNextProps = {
  current: ScheduleItem
  next: ScheduleItem
  fullscreen?: boolean
  onOpen?: () => void
}

function ActivityCard({ activity, kind, onOpen }: { activity: ScheduleItem; kind: 'current' | 'next'; onOpen?: () => void }) {
  return (
    <button className={`activity-card ${kind}`} onClick={onOpen} disabled={!onOpen}>
      <span className="activity-eyebrow">{kind === 'current' ? 'Teraz' : 'Potem'}</span>
      <span className="activity-body">
        <span className="activity-icon" aria-hidden="true"><span>{activity.icon}</span></span>
        <strong>{activity.shortTitle}</strong>
        {activity.instruction && <small>{activity.instruction}</small>}
        <span className="activity-time">{activity.time}–{activity.endTime}</span>
      </span>
    </button>
  )
}

export function NowNext({ current, next, fullscreen = false, onOpen }: NowNextProps) {
  return (
    <section className={`now-next ${fullscreen ? 'now-next-fullscreen' : ''}`} aria-label="Teraz i potem">
      <ActivityCard activity={current} kind="current" onOpen={onOpen} />
      <div className="now-next-arrow"><ArrowRight aria-hidden="true" /></div>
      <ActivityCard activity={next} kind="next" onOpen={onOpen} />
    </section>
  )
}
