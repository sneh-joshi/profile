import { useMemo, useRef, useState } from 'react'
import type { WheelEvent } from 'react'
import type { ExperienceItem } from '../types/profile'
import './ExperienceTimeline.css'

interface EducationItem {
  degree: string
  school: string
  period?: string
}

interface ExperienceTimelineProps {
  experience: ExperienceItem[]
  education: EducationItem[]
}

type TimelineEntry = {
  id: string
  kind: 'experience' | 'education'
  title: string
  subtitle: string
  period: string
  sortable: number
  bullets: string[]
}

function toSortable(period: string): number {
  const lower = period.toLowerCase()
  const yearMatch = lower.match(/(19|20)\d{2}/)
  const year = yearMatch ? parseInt(yearMatch[0], 10) : 0

  const monthMap: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  }

  const monthKey = Object.keys(monthMap).find((m) => lower.includes(m))
  const month = monthKey ? monthMap[monthKey] : 1

  return year * 100 + month
}

function makeTimeline(experience: ExperienceItem[], education: EducationItem[]): TimelineEntry[] {
  const expItems: TimelineEntry[] = experience.map((item, idx) => {
    const startPeriod = item.period.split('–')[0].trim()
    return {
      id: `exp-${idx}`,
      kind: 'experience',
      title: item.company,
      subtitle: item.role,
      period: item.period,
      sortable: toSortable(startPeriod),
      bullets: item.bullets,
    }
  })

  const eduItems: TimelineEntry[] = education.map((item, idx) => ({
    id: `edu-${idx}`,
    kind: 'education',
    title: item.school,
    subtitle: item.degree,
    period: item.period ?? 'Past',
    sortable: toSortable(item.period ?? '2010'),
    bullets: [item.degree],
  }))

  return [...expItems, ...eduItems].sort((a, b) => b.sortable - a.sortable)
}

export default function ExperienceTimeline({ experience, education }: ExperienceTimelineProps) {
  const entries = useMemo(() => makeTimeline(experience, education), [experience, education])
  const [activeId, setActiveId] = useState(entries[0]?.id ?? '')

  const activeEntry = entries.find((entry) => entry.id === activeId) ?? entries[0]
  const railRef = useRef<HTMLDivElement | null>(null)

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!railRef.current) return
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      railRef.current.scrollLeft += event.deltaY
      event.preventDefault()
    }
  }

  const onRailScroll = () => {
    if (!railRef.current || entries.length === 0) return
    const first = railRef.current.querySelector('.htl__point') as HTMLElement | null
    if (!first) return
    const pointWidth = first.offsetWidth + 8
    const index = Math.round(railRef.current.scrollLeft / pointWidth)
    const safeIndex = Math.max(0, Math.min(entries.length - 1, index))
    const next = entries[safeIndex]
    if (next && next.id !== activeId) {
      setActiveId(next.id)
    }
  }

  return (
    <div className="htl">
      <div className="htl__rail-wrap" onWheel={onWheel}>
        <div className="htl__rail" ref={railRef} onScroll={onRailScroll}>
          {entries.map((entry) => (
            <button
              key={entry.id}
              className={`htl__point${entry.id === activeId ? ' htl__point--active' : ''}`}
              onClick={() => setActiveId(entry.id)}
            >
              <span className="htl__dot" aria-hidden="true" />
              <span className="htl__period">{entry.period}</span>
              <span className="htl__label">{entry.kind === 'experience' ? 'Experience' : 'Education'}</span>
            </button>
          ))}
        </div>
      </div>

      {activeEntry && (
        <article key={activeEntry.id} className="htl__card">
          <div className="htl__card-top">
            <span className={`htl__kind htl__kind--${activeEntry.kind}`}>
              {activeEntry.kind === 'experience' ? 'Experience' : 'Education'}
            </span>
            <span className="htl__card-period">{activeEntry.period}</span>
          </div>

          <h3 className="htl__title">{activeEntry.title}</h3>
          <p className="htl__subtitle">{activeEntry.subtitle}</p>

          <ul className="htl__bullets">
            {activeEntry.bullets.map((bullet, idx) => (
              <li key={idx} className="htl__bullet">
                {bullet}
              </li>
            ))}
          </ul>
        </article>
      )}
    </div>
  )
}
