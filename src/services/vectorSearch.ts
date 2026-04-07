/**
 * vectorSearch.ts
 * Cosine-similarity vector search over embedded document chunks.
 */

import type { EmbeddedChunk, SearchResult } from '../types/rag'

/**
 * Computes cosine similarity between two equal-length numeric vectors.
 * Returns a value in [0, 1] (both vectors are non-negative TF weights).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0

  let dot = 0
  let magA = 0
  let magB = 0

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB)
  return denom === 0 ? 0 : dot / denom
}

/**
 * Searches `chunks` for the `topK` most similar chunks to `queryEmbedding`.
 * Returns results sorted by descending cosine similarity score.
 *
 * @param queryEmbedding  Embedding vector for the query.
 * @param chunks          Embedded document chunks to search.
 * @param topK            Number of top results to return (default 3).
 */
export function searchChunks(
  queryEmbedding: number[],
  chunks: EmbeddedChunk[],
  topK: number = 3,
): SearchResult[] {
  const scored = chunks.map((chunk) => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }))

  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, topK).map((item, index) => ({
    chunk: item.chunk,
    score: item.score,
    rank: index + 1,
  }))
}
