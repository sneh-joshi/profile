import { useState, useCallback } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import './RagDemo.css'
import type { RAGPipelineState } from '../types/rag'
import { answerFromPrepared, makeInitialState, prepareDocument } from '../services/ragPipeline'

interface PipelineStep {
  key: Extract<RAGPipelineState['stage'], 'parsing' | 'chunking' | 'embedding' | 'searching' | 'generating'>
  label: string
  shortLabel: string
}

const PIPELINE_STEPS: PipelineStep[] = [
  { key: 'parsing', label: 'Parse', shortLabel: '1' },
  { key: 'chunking', label: 'Chunk', shortLabel: '2' },
  { key: 'embedding', label: 'Embed', shortLabel: '3' },
  { key: 'searching', label: 'Search', shortLabel: '4' },
  { key: 'generating', label: 'Generate', shortLabel: '5' },
]

const STAGE_ORDER: RAGPipelineState['stage'][] = [
  'idle',
  'parsing',
  'chunking',
  'embedding',
  'ready',
  'searching',
  'generating',
  'done',
]

function getStepState(
  stepKey: PipelineStep['key'],
  currentStage: RAGPipelineState['stage'],
): 'idle' | 'active' | 'completed' {
  const stepIdx = STAGE_ORDER.indexOf(stepKey)
  const currentIdx = STAGE_ORDER.indexOf(currentStage)

  if (currentStage === 'error') return 'idle'
  if (currentIdx > stepIdx) return 'completed'
  if (currentIdx === stepIdx) return 'active'
  return 'idle'
}

function PipelineStepper({ stage }: { stage: RAGPipelineState['stage'] }) {
  return (
    <div className="rag-pipeline" role="list" aria-label="Pipeline stages">
      {PIPELINE_STEPS.map((step) => {
        const state = getStepState(step.key, stage)
        return (
          <div
            key={step.key}
            className={`rag-pipeline__step rag-pipeline__step--${state}`}
            role="listitem"
            aria-current={state === 'active' ? 'step' : undefined}
          >
            <div className="rag-pipeline__dot" aria-hidden="true">
              {state === 'completed' ? '✓' : step.shortLabel}
            </div>
            <span className="rag-pipeline__label">{step.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function RagDemo() {
  const [file, setFile] = useState<File | null>(null)
  const [query, setQuery] = useState('')
  const [pipelineState, setPipelineState] = useState<RAGPipelineState>(makeInitialState())
  const [isDragging, setIsDragging] = useState(false)

  const isPreparing = ['parsing', 'chunking', 'embedding'].includes(pipelineState.stage)
  const isAnswering = ['searching', 'generating'].includes(pipelineState.stage)
  const isBusy = isPreparing || isAnswering
  const isPrepared = ['ready', 'done'].includes(pipelineState.stage) && pipelineState.embeddedChunks.length > 0

  const canProcess = !!file && !isBusy
  const canAsk = isPrepared && query.trim().length > 0 && !isBusy

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setQuery('')
    setPipelineState(makeInitialState())
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files?.[0] ?? null
    if (dropped) {
      setFile(dropped)
      setQuery('')
      setPipelineState(makeInitialState())
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const handleProcessDocument = useCallback(async () => {
    if (!file) return
    await prepareDocument(file, (next) => setPipelineState({ ...next }))
  }, [file])

  const handleAsk = useCallback(async () => {
    if (!isPrepared || !query.trim()) return
    await answerFromPrepared(pipelineState, query.trim(), (next) => setPipelineState({ ...next }))
  }, [isPrepared, pipelineState, query])

  const showResults = ['done', 'ready'].includes(pipelineState.stage) && pipelineState.results.length > 0
  const showError = pipelineState.stage === 'error' && !!pipelineState.error

  return (
    <section className="rag-demo" aria-labelledby="rag-demo-title">
      <header className="rag-demo__header">
        <h2 className="rag-demo__title" id="rag-demo-title">RAG Demo</h2>
        <p className="rag-demo__description">
          Upload first to parse, chunk, and embed in-browser. Then ask questions over the prepared
          vectors — no backend required.
        </p>
        <span className="rag-demo__badge">Client-Side TF-IDF Embeddings (Demo)</span>
      </header>

      <PipelineStepper stage={pipelineState.stage} />

      <div className="rag-controls">
        <div
          className={`rag-upload${isDragging ? ' rag-upload--dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          aria-label="File upload area"
        >
          <input
            type="file"
            accept=".txt,.pdf"
            onChange={handleFileChange}
            aria-label="Select a TXT or PDF file"
            disabled={isBusy}
          />
          <div className="rag-upload__icon" aria-hidden="true">📄</div>
          <p className="rag-upload__label">
            <strong>Click to upload</strong> or drag &amp; drop
            <br />
            <small>TXT or PDF (best-effort extraction)</small>
          </p>
          {file && <span className="rag-upload__filename">{file.name}</span>}
        </div>

        <div className="rag-process-row">
          <button
            className={`rag-run-btn${isPreparing ? ' rag-run-btn--running' : ''}`}
            onClick={handleProcessDocument}
            disabled={!canProcess}
          >
            {isPreparing ? 'Processing…' : 'Process Document'}
          </button>
          <span className={`rag-status ${isPrepared ? 'rag-status--ok' : ''}`}>
            {isPrepared
              ? `Ready (${pipelineState.chunks.length} chunks, ${pipelineState.embeddedChunks.length} embeddings)`
              : 'Upload and process document before asking questions'}
          </span>
        </div>

        <div className="rag-query-row">
          <input
            className="rag-query-input"
            type="text"
            placeholder={isPrepared ? 'Ask a question about the document…' : 'Process document first…'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canAsk && handleAsk()}
            disabled={!isPrepared || isBusy}
            aria-label="Query input"
          />
          <button
            className={`rag-run-btn${isAnswering ? ' rag-run-btn--running' : ''}`}
            onClick={handleAsk}
            disabled={!canAsk}
          >
            {isAnswering ? 'Searching…' : 'Ask Question'}
          </button>
        </div>
      </div>

      {showError && (
        <div className="rag-error" role="alert">
          <span className="rag-error__icon" aria-hidden="true">⚠️</span>
          <p className="rag-error__message">{pipelineState.error}</p>
        </div>
      )}

      {showResults && (
        <div className="rag-results" aria-label="RAG results">
          <div className="rag-results__header">
            <h3 className="rag-results__title">Retrieved Chunks</h3>
            <span className="rag-results__chunk-badge">
              {pipelineState.chunks.length} chunks total
            </span>
          </div>

          {pipelineState.results.map((result) => (
            <div
              key={result.chunk.id}
              className={`rag-result-card${result.rank === 1 ? ' rag-result-card--top' : ''}`}
            >
              <div className="rag-result-card__meta">
                <span className="rag-result-card__rank">#{result.rank}</span>
                <span className="rag-result-card__score">score: {result.score.toFixed(4)}</span>
                <span className="rag-result-card__id">{result.chunk.id}</span>
              </div>
              <p className="rag-result-card__text">
                {result.chunk.text.length > 100
                  ? `${result.chunk.text.slice(0, 100).trimEnd()}…`
                  : result.chunk.text}
              </p>
            </div>
          ))}

          {pipelineState.answer && (
            <div className="rag-answer" aria-label="Generated answer">
              <p className="rag-answer__heading">
                <span className="rag-answer__heading-dot" aria-hidden="true" />
                generated answer
              </p>
              <pre className="rag-answer__body">{pipelineState.answer}</pre>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
