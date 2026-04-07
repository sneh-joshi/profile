import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { profileData } from '../utils/profileData'
import { SkillsGrid } from '../components/SkillsGrid'
import ExperienceTimeline from '../components/ExperienceTimeline'
import './Profile.css'

const GITHUB_USERNAME = 'sneh-joshi'
const SHOW_OPEN = import.meta.env.VITE_OPEN_TO_OPPORTUNITIES === 'true'

interface StatDef {
  countTo: number
  decimals: number
  format: (n: number) => string
  label: string
  detail: string
}

interface GlanceItem { icon: string; key: string; val: string; open?: boolean }

const GLANCE: GlanceItem[] = [
  { icon: '◈', key: 'Currently',  val: 'The Washington Post'                 },
  { icon: '▸', key: 'Role',       val: 'Senior Software Engineer'            },
  { icon: '◉', key: 'Experience', val: '9 years'                             },
  { icon: '⬡', key: 'Core Stack', val: 'TypeScript · Node.js · AWS · Python' },
  { icon: '◎', key: 'Focus',      val: 'AI Systems · Cloud Architecture'    },
  { icon: '✦', key: 'Status',     val: 'Open to opportunities', open: true   },
]

const STATS: StatDef[] = [
  {
    countTo: 4000, decimals: 0,
    format: (n) => `${Math.floor(n).toLocaleString()}+`,
    label: 'req / min',
    detail: 'peak throughput',
  },
  {
    countTo: 99.70, decimals: 2,
    format: (n) => `${n.toFixed(2)}%`,
    label: 'SLO',
    detail: 'uptime reliability',
  },
  {
    countTo: 10, decimals: 0,
    format: (n) => `${Math.floor(n)}K+`,
    label: 'entities',
    detail: 'hybrid-search indexed',
  },
  {
    countTo: 15, decimals: 0,
    format: (n) => `${Math.floor(n)} min`,
    label: 'CI/CD',
    detail: 'deploy time, was ~40',
  },
]

function StatItem({ stat, active, delay }: { stat: StatDef; active: boolean; delay: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) return
    const wait = setTimeout(() => {
      const duration = 1600
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setVal(parseFloat((eased * stat.countTo).toFixed(stat.decimals)))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(wait)
  }, [active, stat.countTo, stat.decimals, delay])

  return (
    <div className="profile__stat-item">
      <span className="profile__stat-num">{stat.format(val)}</span>
      <span className="profile__stat-label">{stat.label}</span>
      <span className="profile__stat-detail">{stat.detail}</span>
    </div>
  )
}

export function Profile() {
  const { name, email, skills, experience, education } = profileData
  const containerRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLAnchorElement>(null)
  const [statsActive, setStatsActive] = useState(false)

  // Scroll reveal
  useEffect(() => {
    const reveals = containerRef.current?.querySelectorAll('[data-reveal]') ?? []
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.06 },
    )
    reveals.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  // Stats count-up trigger
  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setStatsActive(true); obs.disconnect() }
      },
      { threshold: 0.25 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Magnetic CTA button
  useEffect(() => {
    const btn = ctaRef.current
    if (!btn) return
    const onMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect()
      const dx = e.clientX - (rect.left + rect.width / 2)
      const dy = e.clientY - (rect.top + rect.height / 2)
      btn.style.transform = `translate(${dx * 0.22}px, ${dy * 0.22}px)`
    }
    const onLeave = () => { btn.style.transform = '' }
    btn.addEventListener('mousemove', onMove)
    btn.addEventListener('mouseleave', onLeave)
    return () => {
      btn.removeEventListener('mousemove', onMove)
      btn.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <main className="profile">
      <div className="profile__container" ref={containerRef}>

        {/* ─── Hero ─── */}
        <section className="profile__hero">

          {/* Two-column: identity left, at-a-glance right */}
          <div className="profile__hero-grid">

            <div className="profile__hero-left">
              <div className="profile__hero-top">
                <div className="profile__avatar-wrap">
                  <img
                    src={`https://github.com/${GITHUB_USERNAME}.png`}
                    alt={name}
                    className="profile__avatar"
                    loading="eager"
                  />
                  <span className="profile__avatar-ring" />
                </div>
                {SHOW_OPEN && (
                  <div className="profile__badge-row">
                    <span className="profile__badge">
                      <span className="profile__badge-dot" />
                      Open to opportunities
                    </span>
                  </div>
                )}
              </div>

              <div className="profile__hero-text">
                <h1 className="profile__name">
                  <span className="profile__name-reveal">{name}</span>
                </h1>
                <p className="profile__role profile__animate" style={{ '--i': 1 } as CSSProperties}>
                  Senior Software Engineer
                </p>
              </div>

              <div className="profile__cta profile__animate" style={{ '--i': 3 } as CSSProperties}>
                <a href={`mailto:${email}`} className="profile__cta-btn profile__cta-btn--primary" ref={ctaRef}>
                  Get in Touch
                </a>
                <a
                  href={`https://github.com/${GITHUB_USERNAME}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile__cta-btn profile__cta-btn--ghost"
                >
                  GitHub ↗
                </a>
              </div>
            </div>

            {/* At a Glance card */}
            <aside className="profile__glance profile__animate" style={{ '--i': 2 } as CSSProperties}>
              <p className="profile__glance-heading">At a Glance</p>
              <ul className="profile__glance-list">
                {GLANCE.filter(({ key }) => key !== 'Status' || SHOW_OPEN).map(({ icon, key, val, open }) => (
                  <li key={key} className="profile__glance-item">
                    <span className="profile__glance-icon">{icon}</span>
                    <div className="profile__glance-detail">
                      <span className="profile__glance-key">{key}</span>
                      <span className={`profile__glance-val${open ? ' profile__glance-val--open' : ''}`}>{val}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="profile__glance-footer">
                <a href={`mailto:${email}`} className="profile__glance-email">{email}</a>
              </div>
            </aside>

          </div>

          {/* Stats bar — full width */}
          <div
            className="profile__stats-wrap profile__animate"
            ref={statsRef}
            style={{ '--i': 4 } as CSSProperties}
          >
            <p className="profile__stats-source">Production — The Washington Post, 2022–Present</p>
            <div className="profile__stats-row">
              {STATS.map((stat, i) => (
                <StatItem key={stat.label} stat={stat} active={statsActive} delay={i * 120} />
              ))}
            </div>
          </div>

        </section>

        {/* ─── Skills ─── */}
        <section
          className="profile__section"
          data-reveal
          style={{ '--reveal-delay': '0ms' } as CSSProperties}
        >
          <h2 className="profile__section-title">Core Expertise</h2>
          <SkillsGrid skills={skills} />
        </section>

        {/* ─── Timeline ─── */}
        <section
          className="profile__section"
          data-reveal
          style={{ '--reveal-delay': '80ms' } as CSSProperties}
        >
          <h2 className="profile__section-title">Career Timeline</h2>
          <ExperienceTimeline experience={experience} education={education} />
        </section>

      </div>
    </main>
  )
}

export default Profile
