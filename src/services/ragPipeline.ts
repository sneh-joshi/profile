import type { RAGPipelineState } from '../types/rag'
import { parseFile } from './documentParser'
import { chunkText } from './chunkingService'
import { embedChunks, buildVocabulary, embedQuery } from './embeddingService'
import { searchChunks } from './vectorSearch'

function truncate(text: string, maxLen: number): string {
  return text.length <= maxLen ? text : text.slice(0, maxLen).trimEnd() + '…'
}

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

export function makeInitialState(query = ''): RAGPipelineState {
  return {
    stage: 'idle',
    chunks: [],
    vocabulary: [],
    embeddedChunks: [],
    query,
    results: [],
    answer: '',
  }
}

function composeAnswer(query: string, chunkTexts: string[], scores: number[]): string {
  if (chunkTexts.length === 0) {
    return 'No relevant content was found in the document for your query.'
  }

  // Extract query terms (non-trivial words)
  const queryTerms = new Set(
    query
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2),
  )

  // Score individual sentences by how many query terms they contain
  interface ScoredSentence { text: string; score: number }
  const scored: ScoredSentence[] = []

  for (const chunk of chunkTexts) {
    // Split on sentence-ending punctuation
    const sentences = chunk
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 30)

    for (const sentence of sentences) {
      const words = sentence.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/)
      const termHits = words.filter((w) => queryTerms.has(w)).length
      if (termHits > 0) {
        scored.push({ text: sentence, score: termHits })
      }
    }
  }

  scored.sort((a, b) => b.score - a.score)
  const topSentences = scored.slice(0, 3).map((s) => s.text)

  if (topSentences.length > 0) {
    return `From the document, the most relevant passages for "${query}":\n\n` +
      topSentences.map((s) => `• ${s}`).join('\n\n')
  }

  // Fallback: show top chunk excerpts cleanly (no [Chunk N] labels)
  const hasGoodScore = scores[0] > 0.05
  if (!hasGoodScore) {
    return `The document doesn't appear to contain a clear answer to "${query}".\n\nMost relevant passage:\n\n${truncate(chunkTexts[0], 400)}`
  }

  return `Most relevant passages for "${query}":\n\n` +
    chunkTexts.slice(0, 2).map((t) => `• ${truncate(t, 250)}`).join('\n\n')
}

export async function prepareDocument(
  file: File,
  onStageChange: (state: RAGPipelineState) => void,
): Promise<RAGPipelineState> {
  let state = makeInitialState()

  const emit = (patch: Partial<RAGPipelineState>) => {
    state = { ...state, ...patch }
    onStageChange(state)
  }

  try {
    emit({ stage: 'parsing', filename: file.name, error: undefined })
    await tick()

    const rawText = await parseFile(file)
    if (!rawText || rawText.trim().length < 10) {
      throw new Error('Could not extract readable text from the uploaded file.')
    }

    emit({ rawText, stage: 'chunking' })
    await tick()

    const chunks = chunkText(rawText, 512, 64)
    if (chunks.length === 0) {
      throw new Error('Document produced no text chunks. Try a different file.')
    }

    emit({ chunks, stage: 'embedding' })
    await tick()

    const { vocabulary, embeddedChunks } = embedChunks(chunks)

    emit({
      vocabulary,
      embeddedChunks,
      stage: 'ready',
      query: '',
      results: [],
      answer: '',
    })

    return state
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred.'
    emit({ stage: 'error', error: message })
    return state
  }
}

export async function answerFromPrepared(
  preparedState: RAGPipelineState,
  query: string,
  onStageChange: (state: RAGPipelineState) => void,
): Promise<RAGPipelineState> {
  let state: RAGPipelineState = {
    ...preparedState,
    query,
    error: undefined,
  }

  const emit = (patch: Partial<RAGPipelineState>) => {
    state = { ...state, ...patch }
    onStageChange(state)
  }

  try {
    if (!preparedState.chunks.length || !preparedState.embeddedChunks.length) {
      throw new Error('Upload and embed a document before asking questions.')
    }

    emit({ stage: 'searching', query, results: [], answer: '' })
    await tick()

    const vocabulary = preparedState.vocabulary.length > 0
      ? preparedState.vocabulary
      : buildVocabulary(preparedState.chunks)
    const queryEmbedding = embedQuery(query, vocabulary)
    const results = searchChunks(queryEmbedding, preparedState.embeddedChunks, 3)

    emit({ stage: 'generating', results })
    await tick()

    const answer = composeAnswer(
      query,
      results.map((result) => result.chunk.text),
      results.map((result) => result.score),
    )
    emit({ stage: 'done', answer })

    return state
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred.'
    emit({ stage: 'error', error: message })
    return state
  }
}

export async function runRAGPipeline(
  file: File,
  query: string,
  onStageChange: (state: RAGPipelineState) => void,
): Promise<RAGPipelineState> {
  const prepared = await prepareDocument(file, onStageChange)
  if (prepared.stage === 'error') return prepared
  return answerFromPrepared(prepared, query, onStageChange)
}
