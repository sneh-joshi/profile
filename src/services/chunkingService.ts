/**
 * chunkingService.ts
 * Sliding-window sentence-aware text chunker.
 * Splits text into overlapping DocumentChunk objects for use in a RAG pipeline.
 */

import type { DocumentChunk } from '../types/rag'

/**
 * Splits `text` into overlapping chunks of approximately `chunkSize` characters.
 * Strategy:
 *  1. Split the text on sentence boundaries (". ").
 *  2. Greedily accumulate sentences until the chunk reaches `chunkSize` chars.
 *  3. Slide forward by removing sentences from the front until the remaining
 *     content is ≤ `overlap` chars, producing the next chunk's seed.
 *
 * @param text       Full document text.
 * @param chunkSize  Target maximum characters per chunk (default 512).
 * @param overlap    Character overlap between consecutive chunks (default 64).
 * @returns          Array of DocumentChunk objects with positional metadata.
 */
export function chunkText(
  text: string,
  chunkSize: number = 512,
  overlap: number = 64,
): DocumentChunk[] {
  if (!text || text.trim().length === 0) return []

  // Split on sentence endings, preserving the delimiter
  const rawSentences = text.split(/(?<=\. )/)
  const sentences: string[] = rawSentences.flatMap((s) =>
    s.length > chunkSize
      ? // Hard-split over-long sentences to avoid infinite loops
        s.match(new RegExp(`.{1,${chunkSize}}`, 'g')) ?? [s]
      : [s],
  )

  const chunks: DocumentChunk[] = []
  let sentenceIdx = 0
  let charOffset = 0 // tracks absolute position in the original text

  // Build a parallel array of cumulative start positions for each sentence
  const sentenceStarts: number[] = []
  let pos = 0
  for (const s of sentences) {
    sentenceStarts.push(pos)
    pos += s.length
  }

  while (sentenceIdx < sentences.length) {
    // Accumulate sentences into this chunk
    let chunkText = ''
    let chunkStartSentence = sentenceIdx

    while (sentenceIdx < sentences.length && chunkText.length + sentences[sentenceIdx].length <= chunkSize) {
      chunkText += sentences[sentenceIdx]
      sentenceIdx++
    }

    // If nothing accumulated (single sentence too long), force-include it
    if (chunkText.length === 0 && sentenceIdx < sentences.length) {
      chunkText = sentences[sentenceIdx]
      sentenceIdx++
    }

    const startChar = sentenceStarts[chunkStartSentence]
    const endChar = startChar + chunkText.length
    const chunkIndex = chunks.length

    chunks.push({
      id: `chunk_${chunkIndex}`,
      text: chunkText.trim(),
      startChar,
      endChar,
      chunkIndex,
    })

    // Slide back by `overlap` chars to create the overlapping seed for the next chunk
    if (sentenceIdx < sentences.length) {
      let overlapLength = 0
      while (
        sentenceIdx > chunkStartSentence + 1 &&
        overlapLength < overlap
      ) {
        sentenceIdx--
        overlapLength += sentences[sentenceIdx].length
      }
    }
  }

  void charOffset // suppress unused-variable warning; kept for future positional use
  return chunks
}
