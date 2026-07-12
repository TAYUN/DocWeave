import type { AiUsage } from './ai.js'

export type RagSearchRequest = {
  searchText: string
  limit?: number
}

export type RagCitation = {
  /** 稳定的回答内引用标识，例如 c1；回答正文使用 [c1] 关联它。 */
  id: string
  documentId: string
  snapshotVersion: number
  blockId: string
  chunkId?: string
  quote?: string
}

export type RagSearchHit = {
  score: number
  snippet: string
  citation: RagCitation
}

export type RagSearchResponse = {
  searchText: string
  hits: RagSearchHit[]
}

export type RagChatRequest = {
  message: string
  conversationId?: string
  topK?: number
}

export type RagFinishReason = 'stop' | 'length' | 'cancelled' | 'error'

export type RagChatResponse = {
  messageId: string | null
  answer: string
  citations: RagCitation[]
  finishReason: RagFinishReason
  usage: AiUsage | null
}

export type RagStreamError = {
  code:
    | 'RAG_INVALID_REQUEST'
    | 'RAG_PERMISSION_DENIED'
    | 'RAG_RETRIEVAL_FAILED'
    | 'RAG_GENERATION_FAILED'
    | 'RAG_STREAM_FAILED'
  message: string
  retryable: boolean
}

export type RagStreamEvent =
  | {
      type: 'start'
      messageId: string
    }
  | {
      type: 'retrieval'
      citations: RagCitation[]
    }
  | {
      type: 'text-delta'
      delta: string
    }
  | {
      type: 'citation'
      citation: RagCitation
    }
  | {
      type: 'finish'
      finishReason: Exclude<RagFinishReason, 'error'>
      citations: RagCitation[]
      usage: AiUsage | null
    }
  | {
      type: 'error'
      error: RagStreamError
    }
