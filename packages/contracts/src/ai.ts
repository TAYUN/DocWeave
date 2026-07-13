export type AiProvider = 'aliyun_openai_compatible'

export type AiModelKind = 'chat' | 'embedding'

export type AiModelRef = {
  provider: AiProvider
  kind: AiModelKind
  model: string
}

export type AiChatRole = 'system' | 'user' | 'assistant'

export type AiChatMessage = {
  role: AiChatRole
  content: string
}

export type AiUsage = {
  inputTokens: number | null
  outputTokens: number | null
  totalTokens: number | null
}

export type AiChatRequest = {
  model: AiModelRef
  messages: AiChatMessage[]
  temperature?: number
  maxOutputTokens?: number
}

export type AiChatResponse = {
  model: AiModelRef
  text: string
  finishReason: string | null
  usage: AiUsage | null
}

export type AiEmbeddingRequest = {
  model: AiModelRef
  values: string[]
  dimensions?: number
}

export type AiEmbeddingResponse = {
  model: AiModelRef
  embeddings: number[][]
  dimensions: number
  usage: AiUsage | null
}

export type EditorAiAction =
  | 'rewrite'
  | 'expand'
  | 'shorten'
  | 'translate'
  | 'summarize'

export type EditorAiLocalContext = {
  documentTitle: string
  selectedText: string
  currentBlockText: string
  surroundingText: string
}

export type EditorAiRequestMetadata = {
  documentId: string
  action?: EditorAiAction
  targetLanguage?: string
  localContext?: EditorAiLocalContext
}

export type EditorAiErrorCode =
  | 'unauthenticated'
  | 'document_not_found'
  | 'document_forbidden'
  | 'document_read_only'
  | 'provider_unavailable'
  | 'request_aborted'
  | 'invalid_request'
