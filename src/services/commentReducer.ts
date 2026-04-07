import type {
  CommentState,
  CommentEvent,
  CommentCreatedEvent,
  SuggestionAddedEvent,
  ReplyAddedEvent,
  CommentResolvedEvent,
  CommentReopenedEvent,
} from '../types/comments'

export const initialState: CommentState = {
  comments: {},
  eventLog: [],
}

/**
 * Creates a typed domain event with a generated id and current timestamp.
 * Pure factory — no side effects.
 */
export function createEvent<T extends CommentEvent>(
  type: T['type'],
  userId: string,
  payload: T['payload'],
): T {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    type,
    timestamp: Date.now(),
    userId,
    payload,
  } as T
}

/**
 * Pure reducer — applies a single domain event to produce the next state.
 * State is never mutated.
 */
export function applyEvent(state: CommentState, event: CommentEvent): CommentState {
  switch (event.type) {
    case 'CommentCreated': {
      const { commentId, content, targetId, targetType } = (event as CommentCreatedEvent).payload
      return {
        ...state,
        comments: {
          ...state.comments,
          [commentId]: {
            id: commentId,
            content,
            userId: event.userId,
            targetId,
            targetType,
            timestamp: event.timestamp,
            resolved: false,
            replies: [],
            suggestions: [],
          },
        },
        eventLog: [...state.eventLog, event],
      }
    }

    case 'SuggestionAdded': {
      const { commentId, suggestionId, originalText, suggestedText } = (
        event as SuggestionAddedEvent
      ).payload
      const comment = state.comments[commentId]
      if (!comment) return { ...state, eventLog: [...state.eventLog, event] }
      return {
        ...state,
        comments: {
          ...state.comments,
          [commentId]: {
            ...comment,
            suggestions: [
              ...comment.suggestions,
              {
                id: suggestionId,
                originalText,
                suggestedText,
                userId: event.userId,
                timestamp: event.timestamp,
              },
            ],
          },
        },
        eventLog: [...state.eventLog, event],
      }
    }

    case 'ReplyAdded': {
      const { commentId, replyId, content, parentReplyId } = (event as ReplyAddedEvent).payload
      const comment = state.comments[commentId]
      if (!comment) return { ...state, eventLog: [...state.eventLog, event] }
      return {
        ...state,
        comments: {
          ...state.comments,
          [commentId]: {
            ...comment,
            replies: [
              ...comment.replies,
              {
                id: replyId,
                content,
                userId: event.userId,
                timestamp: event.timestamp,
                parentReplyId,
              },
            ],
          },
        },
        eventLog: [...state.eventLog, event],
      }
    }

    case 'CommentResolved': {
      const { commentId, resolvedBy } = (event as CommentResolvedEvent).payload
      const comment = state.comments[commentId]
      if (!comment) return { ...state, eventLog: [...state.eventLog, event] }
      return {
        ...state,
        comments: {
          ...state.comments,
          [commentId]: {
            ...comment,
            resolved: true,
            resolvedBy,
          },
        },
        eventLog: [...state.eventLog, event],
      }
    }

    case 'CommentReopened': {
      const { commentId } = (event as CommentReopenedEvent).payload
      const comment = state.comments[commentId]
      if (!comment) return { ...state, eventLog: [...state.eventLog, event] }
      return {
        ...state,
        comments: {
          ...state.comments,
          [commentId]: {
            ...comment,
            resolved: false,
            resolvedBy: undefined,
          },
        },
        eventLog: [...state.eventLog, event],
      }
    }

    default:
      return { ...state, eventLog: [...state.eventLog, event] }
  }
}

/**
 * Rebuilds full state by replaying an ordered set of events from scratch.
 * This is the event-sourcing replay pattern.
 */
export function rebuildState(events: CommentEvent[]): CommentState {
  return events.reduce<CommentState>(applyEvent, initialState)
}
