import { useEffect, useMemo, useRef, useState } from 'react'
import {
  answerExperienceQuestion,
  getPredefinedPrompts,
  getWelcomeMessage,
} from '../services/profileAssistant'
import './ExperienceChatbot.css'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

export default function ExperienceChatbot() {
  const QUICK_PROMPTS = useMemo(() => getPredefinedPrompts(), [])
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: getWelcomeMessage() },
  ])

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const canSend = input.trim().length > 0

  const send = () => {
    if (!canSend) return
    const prompt = input.trim()
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: prompt },
      { role: 'assistant', text: answerExperienceQuestion(prompt) },
    ])
    setInput('')
  }

  const handleQuick = (prompt: string) => {
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: prompt },
      { role: 'assistant', text: answerExperienceQuestion(prompt) },
    ])
  }

  return (
    <>
      {open && <div className="terminal__backdrop" onClick={() => setOpen(false)} />}

      <div className={`terminal__panel${open ? ' terminal__panel--open' : ''}`}>
        <div className="terminal__topbar">
          <div className="terminal__traffic">
            <span className="terminal__dot terminal__dot--red" />
            <span className="terminal__dot terminal__dot--yellow" />
            <span className="terminal__dot terminal__dot--green" />
          </div>
          <span className="terminal__title">sneh@portfolio — experience</span>
          <button className="terminal__close" onClick={() => setOpen(false)} aria-label="Close terminal">
            esc
          </button>
        </div>

        <div className="terminal__messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`terminal__line terminal__line--${msg.role}`}>
              <span className={`terminal__sym${msg.role === 'assistant' ? ' terminal__sym--out' : ''}`}>
                {msg.role === 'user' ? '❯' : '»'}
              </span>
              <span className="terminal__text">{msg.text}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="terminal__quick">
          {QUICK_PROMPTS.map((p) => (
            <button key={p} className="terminal__chip" onClick={() => handleQuick(p)}>
              {p}
            </button>
          ))}
        </div>

        <div className="terminal__composer">
          <span className="terminal__composer-sym">❯</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="terminal__input"
            placeholder="ask anything about my experience..."
            onKeyDown={(e) => { if (e.key === 'Enter') send() }}
          />
        </div>
      </div>

      {!open && (
        <button
          className="ask-bar"
          onClick={() => setOpen(true)}
          aria-label="Ask about my experience"
        >
          <span className="ask-bar__icon">⌕</span>
          <span className="ask-bar__placeholder">Ask me about my experience…</span>
          <span className="ask-bar__hint">/</span>
        </button>
      )}
    </>
  )
}
