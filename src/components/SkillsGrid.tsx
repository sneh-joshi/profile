import { useState } from 'react'
import type { SkillCategory } from '../types/profile'
import './SkillsGrid.css'

const CATEGORY_ICONS: Record<SkillCategory, string> = {
  'AI & Search Systems': '◈',
  'Distributed Systems': '⬡',
  'Cloud Architecture': '◎',
  'Backend Engineering': '▸',
  'Observability & DevOps': '◉',
  'Frontend': '◻',
}

interface SkillsGridProps {
  skills: Record<SkillCategory, string[]>
}

export function SkillsGrid({ skills }: SkillsGridProps) {
  const [search, setSearch] = useState('')
  const q = search.toLowerCase().trim()

  const categories = Object.keys(skills) as SkillCategory[]

  const visibleCategories = categories.filter(
    (cat) => !q || cat.toLowerCase().includes(q) || skills[cat].some((s) => s.toLowerCase().includes(q)),
  )

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / (rect.width / 2)
    const dy = (e.clientY - cy) / (rect.height / 2)

    const spotX = ((e.clientX - rect.left) / rect.width) * 100
    const spotY = ((e.clientY - rect.top) / rect.height) * 100
    card.style.setProperty('--spot-x', `${spotX}%`)
    card.style.setProperty('--spot-y', `${spotY}%`)

    const rotY = dx * 7
    const rotX = -dy * 7
    card.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.015, 1.015, 1.015)`
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    card.style.transform = ''
    card.style.setProperty('--spot-x', '50%')
    card.style.setProperty('--spot-y', '50%')
  }

  return (
    <div className="skills-grid-wrap">
      <div className="skills-filter">
        <span className="skills-filter__icon">⌕</span>
        <input
          type="text"
          className="skills-filter__input"
          placeholder="Filter skills — try 'kafka', 'aws', 'rag'…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          spellCheck={false}
        />
        {q && (
          <button className="skills-filter__clear" onClick={() => setSearch('')} aria-label="Clear">
            ×
          </button>
        )}
      </div>

      <div className="skills-grid">
        {visibleCategories.map((category) => (
          <div
            key={category}
            className="skills-grid__card"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className="skills-grid__category-header">
              <span className="skills-grid__icon" aria-hidden="true">
                {CATEGORY_ICONS[category]}
              </span>
              <span className="skills-grid__category-name">{category}</span>
            </div>
            <div className="skills-grid__tags">
              {skills[category].map((skill) => {
                const isMatch = q && skill.toLowerCase().includes(q)
                return (
                  <span
                    key={skill}
                    className={`skills-grid__tag${isMatch ? ' skills-grid__tag--match' : ''}`}
                  >
                    {skill}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {q && visibleCategories.length === 0 && (
        <p className="skills-filter__empty">No skills match "{search}"</p>
      )}
    </div>
  )
}
