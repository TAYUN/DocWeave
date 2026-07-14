import type { AiRuntimeConfig } from '@docweave/ai'
import type { AiModelKind, AiModelRef } from '@docweave/contracts/ai'

export const DEFAULT_DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'

export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-v4'
export const DEFAULT_EMBEDDING_DIMENSIONS = 1024

export type AliyunAiRuntimeConfig = AiRuntimeConfig & {
  enableThinking?: boolean
}

export type AiRuntimeConfigInput = {
  apiKey: string
  baseURL?: string
  chatModel?: string
  enableThinking?: boolean
  embeddingModel?: string
  embeddingDimensions?: number
}

export function createAliyunAiRuntimeConfig(input: AiRuntimeConfigInput): AliyunAiRuntimeConfig {
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
    enableThinking: input.enableThinking,
    embeddingModel: createModelRef('embedding', input.embeddingModel ?? DEFAULT_EMBEDDING_MODEL),
    embeddingDimensions,
  }
}

export function createAliyunFetch(
  config: AliyunAiRuntimeConfig
): typeof globalThis.fetch | undefined {
  if (config.enableThinking !== false) {
    return undefined
  }

  return async (input, init) => {
    if (typeof init?.body !== 'string') {
      return globalThis.fetch(input, init)
    }

    let body: Record<string, unknown>

    try {
      body = JSON.parse(init.body) as Record<string, unknown>
    } catch {
      return globalThis.fetch(input, init)
    }

    if (body.model !== config.chatModel.model) {
      return globalThis.fetch(input, init)
    }

    // DashScope qwen3.6-plus 的思考模式不接受 tool_choice=required；
    // 编辑器 AI 依赖 BlockNote 的强制工具调用，因此仅在显式关闭思考时改写请求。
    return globalThis.fetch(input, {
      ...init,
      body: JSON.stringify({
        ...body,
        enable_thinking: false,
      }),
    })
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
