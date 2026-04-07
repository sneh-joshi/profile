import type { ExperienceItem } from '../types/profile'
import './ExperienceCard.css'

interface ExperienceCardProps {
  item: ExperienceItem
}

export function ExperienceCard({ item }: ExperienceCardProps) {
  return (
    <div className="experience-card">
      <div className="experience-card__header">
        <div className="experience-card__meta">
          <span className="experience-card__company">{item.company}</span>
          <span className="experience-card__period">{item.period}</span>
        </div>
        <span className="experience-card__role">{item.role}</span>
      </div>
      <ul className="experience-card__bullets">
        {item.bullets.map((bullet, i) => (
          <li key={i} className="experience-card__bullet">
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  )
}
