/**
 * embeddingService.ts
 * Client-Side TF-IDF Embeddings (Demo)
 *
 * ⚠️  This is an intentional mock embedding for demo purposes only.
 *     No external API, no ML model — purely deterministic bag-of-words TF-IDF
 *     vectors computed in the browser. Semantic quality is limited; this
 *     demonstrates the RAG pipeline mechanics.
 */

import type { DocumentChunk, EmbeddedChunk } from '../types/rag'

const MAX_VOCAB_SIZE = 3000

/** Common English stopwords to exclude from vocabulary */
const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','as','is','was','are','were','be','been','being','have',
  'has','had','do','does','did','will','would','could','should','may',
  'might','shall','can','need','dare','ought','used','it','its','this',
  'that','these','those','i','you','he','she','we','they','me','him',
  'her','us','them','my','your','his','our','their','what','which','who',
  'whom','when','where','why','how','all','both','each','few','more',
  'most','other','some','such','no','not','only','same','so','than',
  'too','very','just','also','up','out','if','about','into','through',
  'during','before','after','above','below','between','because','while',
  'although','though','since','unless','however','therefore','thus',
])

/** Tokenise a string into lowercase alpha tokens */
function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
}

/**
 * Builds a shared vocabulary of the top `MAX_VOCAB_SIZE` most-frequent
 * non-stopword tokens across all provided chunks.
 */
export function buildVocabulary(chunks: DocumentChunk[]): string[] {
  const freq = new Map<string, number>()

  for (const chunk of chunks) {
    for (const token of tokenise(chunk.text)) {
      freq.set(token, (freq.get(token) ?? 0) + 1)
    }
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_VOCAB_SIZE)
    .map(([term]) => term)
}

/**
 * Generates a TF (term-frequency) vector for `text` over the given `vocabulary`.
 * Each dimension i = count(vocabulary[i] in text) / total_tokens.
 */
export function generateEmbedding(text: string, vocabulary: string[]): number[] {
  const tokens = tokenise(text)
  if (tokens.length === 0) return new Array(vocabulary.length).fill(0)

  const counts = new Map<string, number>()
  for (const t of tokens) {
    counts.set(t, (counts.get(t) ?? 0) + 1)
  }

  return vocabulary.map((term) => (counts.get(term) ?? 0) / tokens.length)
}

/**
 * Embeds all chunks using a shared vocabulary derived from the full corpus.
 * Returns both the vocabulary (for later query embedding) and the embedded chunks.
 */
export function embedChunks(chunks: DocumentChunk[]): { vocabulary: string[]; embeddedChunks: EmbeddedChunk[] } {
  const vocabulary = buildVocabulary(chunks)
  const embeddedChunks = chunks.map((chunk) => ({
    ...chunk,
    embedding: generateEmbedding(chunk.text, vocabulary),
  }))
  return { vocabulary, embeddedChunks }
}

/**
 * Embeds a single query string using a provided (pre-built) vocabulary.
 */
export function embedQuery(query: string, vocabulary: string[]): number[] {
  return generateEmbedding(query, vocabulary)
}
