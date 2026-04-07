export interface DocumentChunk {
  id: string
  text: string
  startChar: number
  endChar: number
  chunkIndex: number
}

export interface EmbeddedChunk extends DocumentChunk {
  embedding: number[]
}

export interface SearchResult {
  chunk: EmbeddedChunk
  score: number
  rank: number
}

export interface RAGPipelineState {
  stage:
    | 'idle'
    | 'parsing'
    | 'chunking'
    | 'embedding'
    | 'ready'
    | 'searching'
    | 'generating'
    | 'done'
    | 'error'
  filename?: string
  rawText?: string
  chunks: DocumentChunk[]
  vocabulary: string[]
  embeddedChunks: EmbeddedChunk[]
  query: string
  results: SearchResult[]
  answer: string
  error?: string
}
