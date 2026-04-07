import { useState, useEffect } from 'react'
import './GitHubActivity.css'

const GITHUB_USERNAME = 'sneh-joshi'

// ── Raw event shapes ──────────────────────────────────────────────────────────
interface RawPullRequest {
  title: string
  number: number
  html_url: string
  head: { ref: string }
  merged: boolean
}

interface RawEvent {
  id: string
  type: string
  repo: { name: string }
  payload: {
    ref?: string
    ref_type?: string
    commits?: { sha: string; message: string }[]
    action?: string
    number?: number
    pull_request?: RawPullRequest
  }
  created_at: string
}

// ── Normalised feed item ──────────────────────────────────────────────────────
type FeedItemType = 'push' | 'pr_merged' | 'pr_opened' | 'branch' | 'repo'

interface FeedItem {
  id: string
  type: FeedItemType
  repoShort: string
  description: string
  branch?: string
  date: string        // ISO
  display: string     // formatted relative
  url: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)       return 'just now'
  if (diff < 3600)     return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)    return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800)   return `${Math.floor(diff / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function parseEvents(raw: RawEvent[]): FeedItem[] {
  const seen = new Set<string>()
  const items: FeedItem[] = []

  for (const e of raw) {
    const repoShort = e.repo.name.replace(`${GITHUB_USERNAME}/`, '')
    const repoUrl = `https://github.com/${e.repo.name}`

    if (e.type === 'PullRequestEvent' && e.payload.pull_request) {
      const pr = e.payload.pull_request
      const action = e.payload.action
      const type: FeedItemType = action === 'closed' && pr.merged ? 'pr_merged' : 'pr_opened'
      const key = `pr-${pr.number}-${type}`
      if (!seen.has(key)) {
        seen.add(key)
        items.push({
          id: e.id,
          type,
          repoShort,
          description: pr.title || `PR #${pr.number}`,
          branch: pr.head.ref,
          date: e.created_at,
          display: relativeTime(e.created_at),
          url: pr.html_url ?? repoUrl,
        })
      }

    } else if (e.type === 'PushEvent') {
      const branch = (e.payload.ref ?? '').replace('refs/heads/', '')
      const commits = e.payload.commits ?? []
      // Show the push even if commit messages are empty
      const key = `push-${e.id}`
      if (!seen.has(key)) {
        seen.add(key)
        const desc = commits.length > 0
          ? commits[0].message.split('\n')[0].slice(0, 72)
          : `Pushed ${commits.length || 'commits'} to ${branch}`
        items.push({
          id: e.id,
          type: 'push',
          repoShort,
          description: desc,
          branch,
          date: e.created_at,
          display: relativeTime(e.created_at),
          url: repoUrl,
        })
      }

    } else if (e.type === 'CreateEvent' && e.payload.ref_type === 'repository') {
      const key = `repo-${e.repo.name}`
      if (!seen.has(key)) {
        seen.add(key)
        items.push({
          id: e.id,
          type: 'repo',
          repoShort,
          description: `Created repository`,
          date: e.created_at,
          display: relativeTime(e.created_at),
          url: repoUrl,
        })
      }
    }

    if (items.length >= 12) break
  }
  return items
}

// ── Type → visual config ──────────────────────────────────────────────────────
const TYPE_CFG: Record<FeedItemType, { icon: string; label: string; cls: string }> = {
  push:      { icon: '↑', label: 'push',       cls: 'gh-badge--push'  },
  pr_merged: { icon: '⊗', label: 'merged PR',  cls: 'gh-badge--merge' },
  pr_opened: { icon: '⊙', label: 'opened PR',  cls: 'gh-badge--pr'    },
  branch:    { icon: '⌥', label: 'branch',     cls: 'gh-badge--branch'},
  repo:      { icon: '⊕', label: 'new repo',   cls: 'gh-badge--repo'  },
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function GitHubActivity() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [status, setStatus] = useState<'loading' | 'ok' | 'empty' | 'error'>('loading')
  const [lastFetched, setLastFetched] = useState<string>('')

  useEffect(() => {
    // Load from baked-in static JSON — no API auth, no rate limits
    const base = import.meta.env.BASE_URL.replace(/\/$/, '')
    fetch(`${base}/content/github-activity.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json() as Promise<RawEvent[]>
      })
      .then((raw) => {
        const parsed = parseEvents(raw)
        setItems(parsed)
        setStatus(parsed.length > 0 ? 'ok' : 'empty')
        if (raw[0]?.created_at) {
          setLastFetched(new Date(raw[0].created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          }))
        }
      })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div className="gh-activity">
      <div className="gh-activity__header">
        <div className="gh-activity__header-left">
          <span className="gh-activity__label">GitHub Activity</span>
          {lastFetched && (
            <span className="gh-activity__fetched">as of {lastFetched}</span>
          )}
        </div>
        <a
          href={`https://github.com/${GITHUB_USERNAME}`}
          target="_blank"
          rel="noopener noreferrer"
          className="gh-activity__link"
        >
          @{GITHUB_USERNAME} ↗
        </a>
      </div>

      {status === 'loading' && (
        <div className="gh-feed">
          {[80, 60, 70, 50, 65].map((w, i) => (
            <div key={i} className="gh-skeleton">
              <div className="gh-skeleton__badge" />
              <div className="gh-skeleton__line" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      )}

      {status === 'error' && (
        <p className="gh-feed__empty">Could not load activity data.</p>
      )}
      {status === 'empty' && (
        <p className="gh-feed__empty">No public activity in snapshot.</p>
      )}

      {status === 'ok' && (
        <ul className="gh-feed">
          {items.map((item) => {
            const cfg = TYPE_CFG[item.type]
            return (
              <li key={item.id} className="gh-feed__row">
                <span className={`gh-badge ${cfg.cls}`}>
                  <span className="gh-badge__icon">{cfg.icon}</span>
                  <span className="gh-badge__label">{cfg.label}</span>
                </span>
                <div className="gh-feed__body">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gh-feed__desc"
                  >
                    {item.description}
                  </a>
                  <div className="gh-feed__meta">
                    <span className="gh-feed__repo">{item.repoShort}</span>
                    {item.branch && (
                      <>
                        <span className="gh-sep">·</span>
                        <span className="gh-feed__branch">{item.branch}</span>
                      </>
                    )}
                    <span className="gh-sep">·</span>
                    <span className="gh-feed__time">{item.display}</span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
