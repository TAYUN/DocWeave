import type { AiUsage } from './ai.js'

/** Qdrant 索引点的领域 payload，具备 Citation 所需的完整来源信息。 */
export type RagIndexBlock = {
  workspaceId: string
  spaceId: string
  documentId: string
  snapshotVersion: number
  blockId: string
  chunkId: string
  headingPath: string[]
  plainText: string
}

export type RagSearchRequest = {
  searchText: string
  spaceId?: string
  limit?: number
}

/** API 权限层已经确认可见，且可参与检索的文档身份。 */
export type RagAuthorizedDocument = {
  workspaceId: string
  spaceId: string
  documentId: string
  /** `null` 表示该文档尚无可供检索的稳定索引版本。 */
  latestIndexedVersion: number | null
}

/** 传入 RAG 领域层的已授权检索范围，不能由 payload 或客户端替代。 */
export type RagRetrievalScope = {
  documents: RagAuthorizedDocument[]
  spaceId?: string
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
  /** 在已授权范围内进一步缩小本次单轮问答的上下文。 */
  spaceId?: string
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
