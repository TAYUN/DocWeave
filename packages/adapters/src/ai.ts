import type {
  AiModelKind,
  AiModelRef,
  AiProvider,
} from '@docweave/contracts/ai'

export const DEFAULT_DASHSCOPE_BASE_URL =
  'https://dashscope.aliyuncs.com/compatible-mode/v1'

export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-v4'
export const DEFAULT_EMBEDDING_DIMENSIONS = 1024

export type AiRuntimeConfig = {
  provider: AiProvider
  apiKey: string
  baseURL: string
  chatModel: AiModelRef
  embeddingModel: AiModelRef
  embeddingDimensions: number
}

export type AiRuntimeConfigInput = {
  apiKey: string
  baseURL?: string
  chatModel?: string
  embeddingModel?: string
  embeddingDimensions?: number
}

export function createAliyunAiRuntimeConfig(input: AiRuntimeConfigInput): AiRuntimeConfig {
  const apiKey = input.apiKey.trim()

  if (!apiKey) {
    throw new Error('DASHSCOPE_API_KEY is required')
  }

  // text-embedding-v4 默认输出 1024 维，必须与 Qdrant collection 保持一致。
  const embeddingDimensions = input.embeddingDimensions ?? DEFAULT_EMBEDDING_DIMENSIONS

  if (!Number.isInteger(embeddingDimensions) || embeddingDimensions <= 0) {
    throw new Error('EMBEDDING_DIMENSIONS must be a positive integer')
  }

  return {
    provider: 'aliyun_openai_compatible',
    apiKey,
    baseURL: normalizeBaseURL(input.baseURL ?? DEFAULT_DASHSCOPE_BASE_URL),
    chatModel: createModelRef('chat', input.chatModel ?? 'qwen-plus'),
    embeddingModel: createModelRef(
      'embedding',
      input.embeddingModel ?? DEFAULT_EMBEDDING_MODEL,
    ),
    embeddingDimensions,
  }
}

export function createModelRef(kind: AiModelKind, model: string): AiModelRef {
  const normalizedModel = model.trim()

  if (!normalizedModel) {
    throw new Error(`${kind} model is required`)
  }

  return {
    provider: 'aliyun_openai_compatible',
    kind,
    model: normalizedModel,
  }
}

function normalizeBaseURL(baseURL: string) {
  const normalized = baseURL.trim().replace(/\/+$/, '')

  if (!normalized) {
    throw new Error('DASHSCOPE_BASE_URL is required')
  }

  return normalized
}
