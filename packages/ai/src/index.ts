import { createOpenAI } from '@ai-sdk/openai'
import { embedMany, generateText, type LanguageModel } from 'ai'
import type {
  AiChatRequest,
  AiChatResponse,
  AiEmbeddingRequest,
  AiEmbeddingResponse,
  AiModelRef,
  AiUsage,
} from '@docweave/contracts/ai'
import type { AiRuntimeConfig } from '@docweave/adapters'

export type AiRuntime = {
  getChatModel(): LanguageModel
  generateText(request: AiChatRequest): Promise<AiChatResponse>
  embedMany(request: AiEmbeddingRequest): Promise<AiEmbeddingResponse>
}

export function createAiRuntime(config: AiRuntimeConfig): AiRuntime {
  const provider = createOpenAI({
    name: config.provider,
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    fetch: createAliyunFetch(config),
  })

  return {
    getChatModel() {
      return provider.chat(config.chatModel.model)
    },

    async generateText(request) {
      assertModelKind(request.model, 'chat')

      // 百炼当前使用 OpenAI Chat Completions 兼容接口，不能走 AI SDK 默认的 Responses 入口。
      const result = await generateText({
        model: provider.chat(request.model.model),
        messages: request.messages,
        temperature: request.temperature,
        maxOutputTokens: request.maxOutputTokens,
      })

      return {
        model: request.model,
        text: result.text,
        finishReason: result.finishReason ?? null,
        usage: toUsage(result.usage),
      }
    },

    async embedMany(request) {
      assertModelKind(request.model, 'embedding')

      // @ai-sdk/openai 会把该 provider option 转成 OpenAI embeddings 的 dimensions 字段。
      const result = await embedMany({
        model: provider.embedding(request.model.model),
        values: request.values,
        providerOptions:
          request.dimensions === undefined
            ? undefined
            : {
                openai: {
                  dimensions: request.dimensions,
                },
              },
      })

      const dimensions = result.embeddings[0]?.length ?? request.dimensions ?? 0

      return {
        model: request.model,
        embeddings: result.embeddings,
        dimensions,
        usage: toEmbeddingUsage(result.usage),
      }
    },
  }
}

function createAliyunFetch(config: AiRuntimeConfig) {
  if (config.enableThinking !== false) {
    return undefined
  }

  return async (input: string | URL | Request, init?: RequestInit) => {
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
    // 编辑器 AI 依赖 BlockNote 的强制工具调用，因此仅在该 runtime 请求中关闭思考模式。
    return globalThis.fetch(input, {
      ...init,
      body: JSON.stringify({
        ...body,
        enable_thinking: false,
      }),
    })
  }
}

function assertModelKind(model: AiModelRef, expected: AiModelRef['kind']) {
  if (model.kind !== expected) {
    throw new Error(`Expected ${expected} model, received ${model.kind}`)
  }
}

function toUsage(
  usage:
    | { inputTokens?: number; outputTokens?: number; totalTokens?: number }
    | undefined,
): AiUsage | null {
  if (!usage) {
    return null
  }

  return {
    inputTokens: usage.inputTokens ?? null,
    outputTokens: usage.outputTokens ?? null,
    totalTokens: usage.totalTokens ?? null,
  }
}

function toEmbeddingUsage(usage: { tokens?: number } | undefined): AiUsage | null {
  if (!usage) {
    return null
  }

  return {
    inputTokens: usage.tokens ?? null,
    outputTokens: null,
    totalTokens: usage.tokens ?? null,
  }
}
