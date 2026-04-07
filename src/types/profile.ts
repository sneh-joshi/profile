export interface Skill {
  name: string
  category: SkillCategory
}

export type SkillCategory =
  | 'AI & Search Systems'
  | 'Distributed Systems'
  | 'Cloud Architecture'
  | 'Backend Engineering'
  | 'Observability & DevOps'
  | 'Frontend'

export interface ExperienceItem {
  company: string
  role: string
  period: string
  bullets: string[]
}

export interface ProfileData {
  name: string
  title: string
  email: string
  summary: string[]
  skills: Record<SkillCategory, string[]>
  experience: ExperienceItem[]
  education: { degree: string; school: string; period?: string }[]
}
