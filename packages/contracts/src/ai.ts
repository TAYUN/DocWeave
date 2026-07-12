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
