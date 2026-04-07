export type CommentEventType =
  | 'CommentCreated'
  | 'SuggestionAdded'
  | 'ReplyAdded'
  | 'CommentResolved'
  | 'CommentReopened'

export interface BaseEvent {
  id: string
  type: CommentEventType
  timestamp: number
  userId: string
}

export interface CommentCreatedEvent extends BaseEvent {
  type: 'CommentCreated'
  payload: {
    commentId: string
    content: string
    targetId: string
    targetType: 'document' | 'paragraph' | 'selection'
  }
}

export interface SuggestionAddedEvent extends BaseEvent {
  type: 'SuggestionAdded'
  payload: {
    commentId: string
    suggestionId: string
    originalText: string
    suggestedText: string
  }
}

export interface ReplyAddedEvent extends BaseEvent {
  type: 'ReplyAdded'
  payload: {
    commentId: string
    replyId: string
    content: string
    parentReplyId?: string
  }
}

export interface CommentResolvedEvent extends BaseEvent {
  type: 'CommentResolved'
  payload: {
    commentId: string
    resolvedBy: string
  }
}

export interface CommentReopenedEvent extends BaseEvent {
  type: 'CommentReopened'
  payload: {
    commentId: string
  }
}

export type CommentEvent =
  | CommentCreatedEvent
  | SuggestionAddedEvent
  | ReplyAddedEvent
  | CommentResolvedEvent
  | CommentReopenedEvent

export interface Reply {
  id: string
  content: string
  userId: string
  timestamp: number
  parentReplyId?: string
}

export interface Suggestion {
  id: string
  originalText: string
  suggestedText: string
  userId: string
  timestamp: number
}

export interface Comment {
  id: string
  content: string
  userId: string
  targetId: string
  targetType: 'document' | 'paragraph' | 'selection'
  timestamp: number
  resolved: boolean
  resolvedBy?: string
  replies: Reply[]
  suggestions: Suggestion[]
}

export interface CommentState {
  comments: Record<string, Comment>
  eventLog: CommentEvent[]
}
