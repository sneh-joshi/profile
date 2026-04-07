import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import './ArchitecturePhilosophy.css'

interface Principle {
  icon: string
  title: string
  description: string
  demoLink?: string
}

const principles: Principle[] = [
  {
    icon: '◇',
    title: 'Stateless Services',
    description:
      'Services hold no in-memory state between requests, enabling horizontal scaling without coordination overhead. Each instance is identical and disposable.',
    demoLink: 'Comment Service demo',
  },
  {
    icon: '◆',
    title: 'Event-Driven Modeling',
    description:
      'Domain events as the source of truth. State is a projection, not the record. Decouples producers from consumers and enables independent scaling. See: Kafka-based architecture at Washington Post.',
  },
  {
    icon: '⬢',
    title: 'Horizontal Scalability',
    description:
      'Design for N instances from day one. No shared mutable state, no sticky sessions, no instance-local caches. Microservices processing 4,000+ RPM with consistent SLO.',
  },
  {
    icon: '◎',
    title: 'Observability First',
    description:
      'SLO ownership means instrumenting from the start — not as an afterthought. Datadog dashboards, CloudWatch alarms, and structured logging defined before the service goes to production.',
  },
  {
    icon: '⊡',
    title: 'Decoupled Validation',
    description:
      'Rule engines and validation layers positioned before ingestion pipelines. Business rules as data, not code. Validation concerns isolated from core domain logic.',
    demoLink: 'Rule Engine demo',
  },
  {
    icon: '◈',
    title: 'RAG & Hybrid Search Architecture',
    description:
      'Semantic retrieval is not magic — it is engineering. Hybrid search (vector + keyword) with pgvector, chunking strategies, embedding pipelines, and retrieval scoring.',
    demoLink: 'RAG demo',
  },
]

interface Connection {
  demo: string
  arrow: string
  insight: string
}

const connections: Connection[] = [
  {
    demo: 'RAG Demo',
    arrow: '→',
    insight:
      'Chunking strategy, embedding generation, cosine similarity — mirrors production vector search pipelines',
  },
  {
    demo: 'Rule Engine',
    arrow: '→',
    insight:
      'JSON-defined rules, typed conditions, pure evaluation functions — matches pre-ingestion validation architecture',
  },
  {
    demo: 'Comment Service',
    arrow: '→',
    insight:
      'Event sourcing, reducer-based state, append-only log — matches Kafka-backed event-driven systems',
  },
]

export default function ArchitecturePhilosophy() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reveals = sectionRef.current?.querySelectorAll('[data-reveal]') ?? []
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target) }
        })
      },
      { threshold: 0.06 },
    )
    reveals.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <div className="arch-section" ref={sectionRef}>
      <div className="container">

        <div className="arch-intro">
          <p className="section-title" data-reveal>Architecture Philosophy</p>
          <h2 className="section-heading" data-reveal style={{ '--reveal-delay': '60ms' } as CSSProperties}>How I Think About Systems</h2>
          <p className="section-description" data-reveal style={{ '--reveal-delay': '120ms' } as CSSProperties}>
            Principles and patterns that guide my approach to building distributed systems at scale.
            These aren't abstract ideals — each one is reflected directly in the demos on this page.
          </p>
        </div>

        {/* ── Principle cards ── */}
        <div className="arch-grid">
          {principles.map((p, i) => (
            <div
              key={p.title}
              className="arch-card"
              data-reveal
              style={{ '--reveal-delay': `${i * 80}ms` } as CSSProperties}
            >
              <div className="arch-card-icon">{p.icon}</div>
              <h3 className="arch-card-title">{p.title}</h3>
              <p className="arch-card-description">{p.description}</p>
              {p.demoLink && (
                <span className="arch-card-link">See in demo: {p.demoLink}</span>
              )}
            </div>
          ))}
        </div>

        {/* ── Connections section ── */}
        <div className="arch-connections" data-reveal style={{ '--reveal-delay': '100ms' } as CSSProperties}>
          <h3 className="arch-connections-heading">
            How These Demos Reflect Production Thinking
          </h3>
          <p className="arch-connections-sub">
            Each interactive demo is a deliberate architectural exercise, not a toy example.
          </p>
          <div className="arch-connection-list">
            {connections.map((c, i) => (
              <div
                key={c.demo}
                className="arch-connection-item"
                data-reveal
                style={{ '--reveal-delay': `${i * 80 + 60}ms` } as CSSProperties}
              >
                <span className="arch-connection-demo">{c.demo}</span>
                <span className="arch-connection-arrow">{c.arrow}</span>
                <p className="arch-connection-insight">{c.insight}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
