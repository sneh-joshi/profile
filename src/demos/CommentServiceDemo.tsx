import { useReducer, useState } from 'react'
import type {
  CommentEvent,
  CommentCreatedEvent,
  SuggestionAddedEvent,
  ReplyAddedEvent,
  CommentResolvedEvent,
  CommentReopenedEvent,
  Comment,
} from '../types/comments'
import { applyEvent, createEvent, rebuildState } from '../services/commentReducer'
import './CommentServiceDemo.css'

// ---------------------------------------------------------------------------
// Seed events — establishes a non-empty starting state for the demo
// ---------------------------------------------------------------------------
const NOW = Date.now()

const seedEvents: CommentEvent[] = [
  {
    id: 'evt_seed_001',
    type: 'CommentCreated',
    timestamp: NOW - 8 * 60 * 1000,
    userId: 'user_alice',
    payload: {
      commentId: 'cmt_seed_001',
      content: 'This paragraph needs a clearer transition sentence before the architecture overview.',
      targetId: 'para_3',
      targetType: 'paragraph',
    },
  },
  {
    id: 'evt_seed_002',
    type: 'SuggestionAdded',
    timestamp: NOW - 6 * 60 * 1000,
    userId: 'user_bob',
    payload: {
      commentId: 'cmt_seed_001',
      suggestionId: 'sug_seed_001',
      originalText: 'The system processes requests.',
      suggestedText: 'The system asynchronously processes requests via the event queue.',
    },
  },
  {
    id: 'evt_seed_003',
    type: 'ReplyAdded',
    timestamp: NOW - 4 * 60 * 1000,
    userId: 'user_alice',
    payload: {
      commentId: 'cmt_seed_001',
      replyId: 'rep_seed_001',
      content: 'Good catch — that makes the data flow much clearer for readers.',
    },
  },
  {
    id: 'evt_seed_004',
    type: 'CommentCreated',
    timestamp: NOW - 2 * 60 * 1000,
    userId: 'user_carol',
    payload: {
      commentId: 'cmt_seed_002',
      content: 'Should we add error handling for the Kafka consumer timeout scenario?',
      targetId: 'doc_1',
      targetType: 'document',
    },
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

function avatarLetter(userId: string): string {
  return (userId.replace('user_', '')[0] ?? '?').toUpperCase()
}

const EVENT_LABEL: Record<string, string> = {
  CommentCreated: 'Comment Created',
  SuggestionAdded: 'Suggestion Added',
  ReplyAdded: 'Reply Added',
  CommentResolved: 'Comment Resolved',
  CommentReopened: 'Comment Reopened',
}

function payloadSummary(event: CommentEvent): string {
  switch (event.type) {
    case 'CommentCreated':
      return `"${event.payload.content.slice(0, 60)}${event.payload.content.length > 60 ? '…' : ''}"`
    case 'SuggestionAdded':
      return `"${event.payload.originalText}" → "${event.payload.suggestedText.slice(0, 40)}…"`
    case 'ReplyAdded':
      return `"${event.payload.content.slice(0, 60)}${event.payload.content.length > 60 ? '…' : ''}"`
    case 'CommentResolved':
      return `resolved by ${event.payload.resolvedBy}`
    case 'CommentReopened':
      return `comment ${event.payload.commentId} reopened`
    default:
      return ''
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
interface CommentCardProps {
  comment: Comment
  replyTarget: string | null
  replyText: string
  suggestionTarget: string | null
  suggOriginal: string
  suggSuggested: string
  onSetReplyTarget: (id: string | null) => void
  onSetReplyText: (v: string) => void
  onSetSuggestionTarget: (id: string | null) => void
  onSetSuggOriginal: (v: string) => void
  onSetSuggSuggested: (v: string) => void
  onSubmitReply: (commentId: string) => void
  onSubmitSuggestion: (commentId: string) => void
  onResolve: (commentId: string) => void
  onReopen: (commentId: string) => void
}

function CommentCard({
  comment,
  replyTarget,
  replyText,
  suggestionTarget,
  suggOriginal,
  suggSuggested,
  onSetReplyTarget,
  onSetReplyText,
  onSetSuggestionTarget,
  onSetSuggOriginal,
  onSetSuggSuggested,
  onSubmitReply,
  onSubmitSuggestion,
  onResolve,
  onReopen,
}: CommentCardProps) {
  const isAddingReply = replyTarget === comment.id
  const isAddingSuggestion = suggestionTarget === comment.id

  return (
    <div className={`csd-comment-card${comment.resolved ? ' csd-comment-card--resolved' : ''}`}>
      <div className="csd-comment-header">
        <div className="csd-avatar">{avatarLetter(comment.userId)}</div>
        <div className="csd-comment-meta">
          <span className="csd-comment-user">{comment.userId}</span>
          <span className="csd-comment-time">{relativeTime(comment.timestamp)}</span>
        </div>
        <span className={`csd-status-badge ${comment.resolved ? 'csd-badge-resolved' : 'csd-badge-active'}`}>
          {comment.resolved ? 'Resolved' : 'Active'}
        </span>
      </div>

      <p className="csd-comment-body">{comment.content}</p>

      <span className="csd-target-tag">
        {comment.targetType} · {comment.targetId}
      </span>

      {comment.suggestions.length > 0 && (
        <div className="csd-suggestions">
          {comment.suggestions.map((s) => (
            <div key={s.id} className="csd-suggestion">
              <div className="csd-suggestion-header">
                <span className="csd-suggestion-label">Suggestion</span>
                <span className="csd-suggestion-author">{s.userId}</span>
                <span className="csd-comment-time">{relativeTime(s.timestamp)}</span>
              </div>
              <div className="csd-diff">
                <div className="csd-diff-line csd-diff-remove">
                  <span className="csd-diff-sign">−</span>
                  <span>{s.originalText}</span>
                </div>
                <div className="csd-diff-line csd-diff-add">
                  <span className="csd-diff-sign">+</span>
                  <span>{s.suggestedText}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {comment.replies.length > 0 && (
        <div className="csd-replies">
          {comment.replies.map((r) => (
            <div key={r.id} className="csd-reply">
              <div className="csd-avatar csd-avatar--sm">{avatarLetter(r.userId)}</div>
              <div className="csd-reply-body">
                <div className="csd-reply-meta">
                  <span className="csd-comment-user">{r.userId}</span>
                  <span className="csd-comment-time">{relativeTime(r.timestamp)}</span>
                </div>
                <p className="csd-reply-text">{r.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAddingReply && (
        <div className="csd-inline-form">
          <textarea
            className="input textarea csd-inline-textarea"
            placeholder="Write a reply…"
            value={replyText}
            onChange={(e) => onSetReplyText(e.target.value)}
            rows={2}
          />
          <div className="csd-inline-actions">
            <button
              className="btn btn-primary"
              onClick={() => onSubmitReply(comment.id)}
              disabled={!replyText.trim()}
            >
              Post Reply
            </button>
            <button className="btn" onClick={() => onSetReplyTarget(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {isAddingSuggestion && (
        <div className="csd-inline-form">
          <input
            className="input csd-inline-input"
            placeholder="Original text…"
            value={suggOriginal}
            onChange={(e) => onSetSuggOriginal(e.target.value)}
          />
          <input
            className="input csd-inline-input"
            placeholder="Suggested replacement…"
            value={suggSuggested}
            onChange={(e) => onSetSuggSuggested(e.target.value)}
          />
          <div className="csd-inline-actions">
            <button
              className="btn btn-primary"
              onClick={() => onSubmitSuggestion(comment.id)}
              disabled={!suggOriginal.trim() || !suggSuggested.trim()}
            >
              Add Suggestion
            </button>
            <button className="btn" onClick={() => onSetSuggestionTarget(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="csd-action-row">
        <button
          className="btn csd-action-btn"
          onClick={() => {
            onSetSuggestionTarget(null)
            onSetReplyTarget(isAddingReply ? null : comment.id)
          }}
        >
          ↩ Reply
        </button>
        <button
          className="btn csd-action-btn"
          onClick={() => {
            onSetReplyTarget(null)
            onSetSuggestionTarget(isAddingSuggestion ? null : comment.id)
          }}
        >
          ✎ Suggest
        </button>
        {comment.resolved ? (
          <button className="btn csd-action-btn csd-action-reopen" onClick={() => onReopen(comment.id)}>
            ↩ Reopen
          </button>
        ) : (
          <button className="btn csd-action-btn csd-action-resolve" onClick={() => onResolve(comment.id)}>
            ✓ Resolve
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Demo Component
// ---------------------------------------------------------------------------
export default function CommentServiceDemo() {
  const [state, dispatch] = useReducer(applyEvent, undefined, () => rebuildState(seedEvents))

  // Add-comment bar
  const [showAddComment, setShowAddComment] = useState(false)
  const [newCommentText, setNewCommentText] = useState('')

  // Inline reply state
  const [replyTarget, setReplyTarget] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  // Inline suggestion state
  const [suggestionTarget, setSuggestionTarget] = useState<string | null>(null)
  const [suggOriginal, setSuggOriginal] = useState('')
  const [suggSuggested, setSuggSuggested] = useState('')

  const comments = Object.values(state.comments).sort((a, b) => a.timestamp - b.timestamp)
  const reversedLog = [...state.eventLog].reverse()

  // ── Action handlers ────────────────────────────────────────────────────────

  function handleAddComment() {
    if (!newCommentText.trim()) return
    const ev = createEvent<CommentCreatedEvent>('CommentCreated', 'user_demo', {
      commentId: genId('cmt'),
      content: newCommentText.trim(),
      targetId: 'doc_1',
      targetType: 'document',
    })
    dispatch(ev)
    setNewCommentText('')
    setShowAddComment(false)
  }

  function handleSubmitReply(commentId: string) {
    if (!replyText.trim()) return
    const ev = createEvent<ReplyAddedEvent>('ReplyAdded', 'user_demo', {
      commentId,
      replyId: genId('rep'),
      content: replyText.trim(),
    })
    dispatch(ev)
    setReplyText('')
    setReplyTarget(null)
  }

  function handleSubmitSuggestion(commentId: string) {
    if (!suggOriginal.trim() || !suggSuggested.trim()) return
    const ev = createEvent<SuggestionAddedEvent>('SuggestionAdded', 'user_demo', {
      commentId,
      suggestionId: genId('sug'),
      originalText: suggOriginal.trim(),
      suggestedText: suggSuggested.trim(),
    })
    dispatch(ev)
    setSuggOriginal('')
    setSuggSuggested('')
    setSuggestionTarget(null)
  }

  function handleResolve(commentId: string) {
    dispatch(
      createEvent<CommentResolvedEvent>('CommentResolved', 'user_demo', {
        commentId,
        resolvedBy: 'user_demo',
      }),
    )
  }

  function handleReopen(commentId: string) {
    dispatch(
      createEvent<CommentReopenedEvent>('CommentReopened', 'user_demo', {
        commentId,
      }),
    )
  }

  // ── Quick-action handlers ──────────────────────────────────────────────────

  function quickAddComment() {
    const ev = createEvent<CommentCreatedEvent>('CommentCreated', 'user_bob', {
      commentId: genId('cmt'),
      content: 'Quick demo comment — added via event dispatch.',
      targetId: 'para_5',
      targetType: 'paragraph',
    })
    dispatch(ev)
  }

  function quickAddSuggestion() {
    const first = comments.find((c) => !c.resolved)
    if (!first) return
    const ev = createEvent<SuggestionAddedEvent>('SuggestionAdded', 'user_carol', {
      commentId: first.id,
      suggestionId: genId('sug'),
      originalText: 'existing text',
      suggestedText: 'improved text with better clarity',
    })
    dispatch(ev)
  }

  function quickResolveFirst() {
    const first = comments.find((c) => !c.resolved)
    if (!first) return
    dispatch(
      createEvent<CommentResolvedEvent>('CommentResolved', 'user_alice', {
        commentId: first.id,
        resolvedBy: 'user_alice',
      }),
    )
  }

  function quickReopenFirst() {
    const first = comments.find((c) => c.resolved)
    if (!first) return
    dispatch(
      createEvent<CommentReopenedEvent>('CommentReopened', 'user_bob', {
        commentId: first.id,
      }),
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="csd-demo">
      <div className="csd-header">
        <p className="section-title">Interactive Demo</p>
        <h2 className="section-heading">Comment &amp; Suggestion Service</h2>
        <p className="section-description">
          Event-sourced comment system modeled with domain events, reducer-based state
          reconstruction, and stateless service design. Every action dispatches an immutable event;
          state is always a deterministic projection of the event log.
        </p>
      </div>

      <div className="csd-panels">
        {/* ── Left panel ── */}
        <div className="csd-panel csd-panel-left">
          <div className="csd-panel-top-bar">
            <div className="csd-panel-label-group">
              <span className="csd-panel-label">Comment Thread View</span>
              <span className="csd-panel-count">
                {comments.length} comment{comments.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              className="btn btn-primary csd-add-btn"
              onClick={() => setShowAddComment((v) => !v)}
            >
              + Add Comment
            </button>
          </div>

          {showAddComment && (
            <div className="csd-add-comment-bar">
              <textarea
                className="input textarea csd-inline-textarea"
                placeholder="Write a comment…"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                rows={3}
              />
              <div className="csd-inline-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleAddComment}
                  disabled={!newCommentText.trim()}
                >
                  Post
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setShowAddComment(false)
                    setNewCommentText('')
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="csd-comment-list">
            {comments.length === 0 && (
              <p className="csd-empty">No comments yet. Add one above.</p>
            )}
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                replyTarget={replyTarget}
                replyText={replyText}
                suggestionTarget={suggestionTarget}
                suggOriginal={suggOriginal}
                suggSuggested={suggSuggested}
                onSetReplyTarget={setReplyTarget}
                onSetReplyText={setReplyText}
                onSetSuggestionTarget={setSuggestionTarget}
                onSetSuggOriginal={setSuggOriginal}
                onSetSuggSuggested={setSuggSuggested}
                onSubmitReply={handleSubmitReply}
                onSubmitSuggestion={handleSubmitSuggestion}
                onResolve={handleResolve}
                onReopen={handleReopen}
              />
            ))}
          </div>

          <div className="csd-quick-actions">
            <span className="csd-quick-label">Quick actions:</span>
            <button className="btn csd-quick-btn" onClick={quickAddComment}>
              Add Comment
            </button>
            <button className="btn csd-quick-btn" onClick={quickAddSuggestion}>
              Add Suggestion
            </button>
            <button className="btn csd-quick-btn" onClick={quickResolveFirst}>
              Resolve First
            </button>
            <button className="btn csd-quick-btn" onClick={quickReopenFirst}>
              Reopen First
            </button>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="csd-panel csd-panel-right">
          <div className="csd-panel-top-bar">
            <div className="csd-panel-label-group">
              <span className="csd-panel-label">Event Log</span>
              <span className="csd-panel-append-badge">append-only</span>
            </div>
            <span className="csd-panel-count">{state.eventLog.length} events</span>
          </div>
          <p className="csd-event-caption">
            State is rebuilt by replaying these events in order.
          </p>

          <div className="csd-event-list">
            {reversedLog.map((event) => (
              <div key={event.id} className="csd-event-item">
                <div className="csd-event-top">
                  <span className={`csd-event-badge csd-evt-${event.type}`}>
                    {EVENT_LABEL[event.type]}
                  </span>
                  <span className="csd-event-user">{event.userId}</span>
                  <span className="csd-comment-time">{relativeTime(event.timestamp)}</span>
                </div>
                <p className="csd-event-payload">{payloadSummary(event)}</p>
              </div>
            ))}
          </div>

          <div className="csd-kafka-info">
            <div className="csd-kafka-icon">⬡</div>
            <div className="csd-kafka-text">
              <p className="csd-kafka-title">In production</p>
              <p className="csd-kafka-desc">
                Events published to Kafka → consumed by stateless processors → state stored in read
                models. This component is a self-contained projection of the same pattern.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
