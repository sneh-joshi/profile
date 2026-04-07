import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import RagDemo from '../demos/RagDemo'
import RuleEngineDemo from '../demos/RuleEngineDemo'
import CommentServiceDemo from '../demos/CommentServiceDemo'
import DocumentProcessingDemo from '../demos/DocumentProcessingDemo'
import './Projects.css'

interface ProjectCard {
  id: string
  title: string
  tagline: string
  description: string
  tags: string[]
  highlights: string[]
  component: React.ReactNode
}

const PROJECTS: ProjectCard[] = [
  {
    id: 'rag',
    title: 'RAG Pipeline',
    tagline: 'Client-Side Retrieval-Augmented Generation',
    description:
      'Upload any document, ask a question — the entire pipeline runs in your browser. No server, no API key required.',
    tags: ['TF-IDF Embeddings', 'Cosine Similarity', 'Chunking', 'Browser-Only'],
    highlights: [
      'Sliding-window text chunker with configurable overlap',
      'Bag-of-words vocabulary embeddings (300-dim)',
      'In-memory vector search with cosine similarity scoring',
      'Template-based answer generation from top-K chunks',
    ],
    component: <RagDemo />,
  },
  {
    id: 'rule-engine',
    title: 'Rule Engine',
    tagline: 'JSON-Defined Validation with Typed Conditions',
    description:
      'A lightweight rule evaluation engine — rules are data, not code. Supports AND/OR condition trees, multiple operators, and structured error reporting.',
    tags: ['Pure Functions', 'No eval()', 'TypeScript', 'JSON Rules'],
    highlights: [
      'Conditions evaluate eq, neq, lt, gt, contains, not_contains operators',
      'Rules defined as typed JSON — no code changes to add rules',
      'AND/OR condition grouping with per-rule severity levels',
      'Mirrors pre-ingestion validation architecture from Washington Post CMS',
    ],
    component: <RuleEngineDemo />,
  },
  {
    id: 'comment-service',
    title: 'Comment Service',
    tagline: 'Event-Sourced Stateless Comment System',
    description:
      'A comment/suggestion system modeled with domain events. State is rebuilt by replaying an append-only event log — stateless, horizontally scalable.',
    tags: ['Event Sourcing', 'Reducer Pattern', 'Kafka-Ready', 'Stateless'],
    highlights: [
      'Domain events: CommentCreated, SuggestionAdded, ReplyAdded, CommentResolved',
      'Pure reducer — state is always a deterministic projection of the event log',
      'rebuildState() replays all events from scratch — debuggable by design',
      'Mirrors the Kafka-backed comment architecture at Washington Post',
    ],
    component: <CommentServiceDemo />,
  },
  {
    id: 'doc-processing',
    title: 'Document Processing',
    tagline: 'PDF Extraction · Confidence Scoring · Human-in-the-Loop Review',
    description:
      'Simulates a document ingestion pipeline — extract structured fields from PDFs, detect signatures, score confidence, and route low-confidence results to a human review queue.',
    tags: ['PDF Extraction', 'Confidence Scoring', 'Human-in-the-Loop', 'Workflow'],
    highlights: [
      'Field extraction with per-field confidence scores from OCR/ML output',
      'Signature detection flagged as uncertain when confidence falls below threshold',
      'Auto-approve high-confidence fields; route low-confidence to review queue',
      'Human reviewer approves or rejects each flagged field before workflow continues',
    ],
    component: <DocumentProcessingDemo />,
  },
]

export default function Projects() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const gridRef = useRef<HTMLDivElement>(null)

  const toggle = (id: string) => {
    // Always mark the card as revealed when opened so it stays visible after closing
    setRevealed((prev) => new Set([...prev, id]))
    setActiveDemo((prev) => (prev === id ? null : id))
  }

  useEffect(() => {
    const reveals = gridRef.current?.querySelectorAll('[data-reveal]') ?? []
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const cardId = (e.target as HTMLElement).dataset.cardId
            if (cardId) {
              setRevealed((prev) => new Set([...prev, cardId]))
            } else {
              e.target.classList.add('is-visible')
            }
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.06 },
    )
    reveals.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <div className="projects">
      <div className="container" ref={gridRef}>
        <p className="section-title" data-reveal>Projects</p>
        <h2 className="section-heading" data-reveal style={{ '--reveal-delay': '60ms' } as CSSProperties}>Engineering Demos</h2>
        <p className="section-description" data-reveal style={{ '--reveal-delay': '120ms' } as CSSProperties}>
          Small, focused examples of patterns I've built and shipped at scale over 9 years.
          Each demo isolates one architectural idea — not the full system, but the core of it.
        </p>

        <div className="projects__grid">
          {PROJECTS.map((project, i) => {
            const isActive = activeDemo === project.id
            return (
              <div
                key={project.id}
                data-card-id={project.id}
                className={`proj-card${isActive ? ' proj-card--active' : ''}${(isActive || revealed.has(project.id)) ? ' is-visible' : ''}`}
                data-reveal
                style={{ '--reveal-delay': `${i * 100}ms` } as CSSProperties}
              >
                <div className="proj-card__top">
                  <div className="proj-card__head">
                    <div>
                      <h3 className="proj-card__title">{project.title}</h3>
                      <p className="proj-card__tagline">{project.tagline}</p>
                    </div>
                    <button
                      className={`proj-card__launch${isActive ? ' proj-card__launch--close' : ''}`}
                      onClick={() => toggle(project.id)}
                    >
                      {isActive ? 'Close' : 'Launch →'}
                    </button>
                  </div>

                  <p className="proj-card__desc">{project.description}</p>

                  <ul className="proj-card__highlights">
                    {project.highlights.map((h, i) => (
                      <li key={i} className="proj-card__highlight">
                        <span className="proj-card__highlight-dot">▸</span>
                        {h}
                      </li>
                    ))}
                  </ul>

                  <div className="proj-card__tags">
                    {project.tags.map((t) => (
                      <span key={t} className="tag">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {isActive && (
                  <div className="proj-card__demo">
                    <div className="proj-card__demo-inner">{project.component}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
