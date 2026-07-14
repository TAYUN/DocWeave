import { QdrantClient } from '@qdrant/js-client-rest'
import { createAliyunAiRuntimeConfig, createAliyunFetch } from '@docweave/adapters'
import { createAiRuntime } from '@docweave/ai'
import type {
  RagAuthorizedDocument,
  RagChatRequest,
  RagRetrievalScope,
  RagSearchRequest,
  RagSearchResponse,
  RagStreamEvent,
} from '@docweave/contracts/rag'
import { retrieveDocumentChunks } from '@docweave/rag'
import { streamText } from 'ai'
import { ApiContractError, apiErrors } from '#exceptions/error_messages'
import env from '#start/env'
import { QdrantRagRetrievalBackend } from '#services/rag_qdrant_retrieval_backend'
import SpaceMembershipService from '#services/space_membership_service'

export type RagSearchInput = RagSearchRequest & { userId: number }
export type RagChatInput = RagChatRequest & { userId: number; signal?: AbortSignal }

type RagServiceDependencies = {
  hasSpaceAccess(userId: number, spaceId: string): Promise<boolean>
  listVisibleDocuments(userId: number): Promise<RagAuthorizedDocument[]>
  embedQuery(searchText: string): Promise<number[]>
  retrieve(input: {
    queryVector: number[]
    scope: RagRetrievalScope
    limit?: number
  }): Promise<RagSearchResponse['hits']>
  streamAnswer(input: {
    message: string
    hits: RagSearchResponse['hits']
    signal?: AbortSignal
  }): AsyncIterable<string>
}

/** 供 HTTP exception handler 映射为共享 AUTH_FORBIDDEN envelope。 */
export class RagSearchForbiddenError extends ApiContractError {
  status = 403

  constructor() {
    super(apiErrors.forbidden.code, apiErrors.forbidden.message)
  }
}

/** Embedding、Qdrant 与 adapter 异常统一隔离，避免泄漏基础设施错误形状。 */
export class RagRetrievalFailedError extends ApiContractError {
  status = 502

  constructor() {
    super(apiErrors.ragRetrievalFailed.code, apiErrors.ragRetrievalFailed.message)
  }
}

export default class RagService {
  private dependencies: RagServiceDependencies

  constructor(dependencies: Partial<RagServiceDependencies> = {}) {
    this.dependencies = { ...createDefaultDependencies(), ...dependencies }
  }

  async search(request: RagSearchInput): Promise<RagSearchResponse> {
    if (
      request.spaceId &&
      !(await this.dependencies.hasSpaceAccess(request.userId, request.spaceId))
    ) {
      throw new RagSearchForbiddenError()
    }

    const documents = await this.dependencies.listVisibleDocuments(request.userId)

    const scope: RagRetrievalScope = {
      documents,
      spaceId: request.spaceId,
    }
    const hasActiveDocument = documents.some(
      (document) =>
        (request.spaceId === undefined || document.spaceId === request.spaceId) &&
        Number.isSafeInteger(document.latestIndexedVersion) &&
        (document.latestIndexedVersion ?? 0) > 0
    )

    if (!hasActiveDocument) {
      return { searchText: request.searchText, hits: [] }
    }

    try {
      const queryVector = await this.dependencies.embedQuery(request.searchText)
      const hits = await this.dependencies.retrieve({
        queryVector,
        scope,
        limit: request.limit,
      })

      return { searchText: request.searchText, hits }
    } catch (error) {
      if (error instanceof ApiContractError) {
        throw error
      }

      throw new RagRetrievalFailedError()
    }
  }

  /**
   * 检索必须先完成，才能让权限与检索错误在 HTTP stream 启动前仍复用 envelope。
   * 模型消费则延后到 generator 内，以便转换为稳定的业务 stream event。
   */
  async prepareChat(request: RagChatInput): Promise<AsyncIterable<RagStreamEvent>> {
    const retrieval = await this.search({
      userId: request.userId,
      searchText: request.message,
      spaceId: request.spaceId,
      limit: request.topK,
    })
    const citations = uniqueCitations(retrieval.hits)
    const messageId = crypto.randomUUID()
    const dependencies = this.dependencies

    return (async function* (): AsyncGenerator<RagStreamEvent> {
      yield { type: 'start', messageId }
      yield { type: 'retrieval', citations }

      let answer: AsyncIterator<string> | undefined
      let answerClosed = false

      const closeAnswer = async () => {
        if (answerClosed || !answer) {
          return
        }

        answerClosed = true
        await answer.return?.()
      }

      try {
        answer = dependencies
          .streamAnswer({
            message: request.message,
            hits: retrieval.hits,
            signal: request.signal,
          })
          [Symbol.asyncIterator]()

        while (true) {
          if (request.signal?.aborted) {
            await closeAnswer()
            yield { type: 'finish', finishReason: 'cancelled', citations, usage: null }
            return
          }

          const next = await answer.next()

          if (request.signal?.aborted) {
            await closeAnswer()
            yield { type: 'finish', finishReason: 'cancelled', citations, usage: null }
            return
          }

          if (next.done) {
            break
          }

          if (next.value) {
            yield { type: 'text-delta', delta: next.value }
          }
        }

        for (const citation of citations) {
          yield { type: 'citation', citation }
        }

        yield { type: 'finish', finishReason: 'stop', citations, usage: null }
      } catch {
        if (request.signal?.aborted) {
          yield { type: 'finish', finishReason: 'cancelled', citations, usage: null }
          return
        }

        yield {
          type: 'error',
          error: {
            code: 'RAG_GENERATION_FAILED',
            message: apiErrors.ragGenerationFailed.message,
            retryable: true,
          },
        }
      } finally {
        await closeAnswer()
      }
    })()
  }
}

function createDefaultDependencies(): RagServiceDependencies {
  const membership = new SpaceMembershipService()

  return {
    hasSpaceAccess: membership.hasSpaceAccess.bind(membership),
    listVisibleDocuments: membership.listVisibleDocuments.bind(membership),
    async embedQuery(searchText) {
      const runtimeConfig = createRagRuntimeConfig()
      const runtime = createAiRuntime(runtimeConfig, { fetch: createAliyunFetch(runtimeConfig) })
      const result = await runtime.embedMany({
        model: runtimeConfig.embeddingModel,
        values: [searchText],
        dimensions: runtimeConfig.embeddingDimensions,
      })
      const embedding = result.embeddings[0]

      if (!embedding || embedding.length === 0) {
        throw new Error('RAG query embedding is empty')
      }

      return embedding
    },
    async retrieve(input) {
      const backend = new QdrantRagRetrievalBackend(
        env.get('QDRANT_COLLECTION')?.trim() || 'document_chunks_v1',
        new QdrantClient({
          url: requireQdrantUrl(),
          apiKey: env.get('QDRANT_API_KEY')?.trim() || undefined,
        })
      )

      return retrieveDocumentChunks(input, backend)
    },
    async *streamAnswer(input) {
      const runtimeConfig = createRagRuntimeConfig()
      const runtime = createAiRuntime(runtimeConfig, { fetch: createAliyunFetch(runtimeConfig) })
      const context = input.hits.map((hit) => `[${hit.citation.id}] ${hit.snippet}`).join('\n\n')
      const result = streamText({
        model: runtime.getChatModel(),
        system:
          'Answer only from the retrieved knowledge below. Cite sources using their [cN] identifiers.\n\n' +
          `Retrieved knowledge:\n${context || '(No indexed knowledge matched this question.)'}`,
        prompt: input.message,
        abortSignal: input.signal,
      })

      for await (const delta of result.textStream) {
        yield delta
      }
    },
  }
}

function uniqueCitations(hits: RagSearchResponse['hits']) {
  const citations = new Map<string, RagSearchResponse['hits'][number]['citation']>()

  for (const hit of hits) {
    citations.set(hit.citation.id, hit.citation)
  }

  return [...citations.values()]
}

function createRagRuntimeConfig() {
  const apiKey = env.get('DASHSCOPE_API_KEY')?.release()

  if (!apiKey) {
    throw new Error('DASHSCOPE_API_KEY is required for RAG search')
  }

  return createAliyunAiRuntimeConfig({
    apiKey,
    baseURL: env.get('DASHSCOPE_BASE_URL'),
    chatModel: env.get('CHAT_MODEL'),
    embeddingModel: env.get('EMBEDDING_MODEL'),
    embeddingDimensions: env.get('EMBEDDING_DIMENSIONS'),
    enableThinking: false,
  })
}

function requireQdrantUrl() {
  const url = env.get('QDRANT_URL')?.trim()

  if (!url) {
    throw new Error('QDRANT_URL is required for RAG search')
  }

  return url
}
