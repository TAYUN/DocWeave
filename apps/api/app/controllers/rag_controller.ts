import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import type { RagStreamEvent } from '@docweave/contracts/rag'
import { Readable } from 'node:stream'
import RagService, { RagRetrievalFailedError, RagSearchForbiddenError } from '#services/rag_service'
import { apiErrors, toApiErrorResponse } from '#exceptions/error_messages'
import { ragChatValidator, ragSearchValidator } from '#validators/runtime'

@inject()
export default class RagController {
  constructor(private rag: RagService) {}

  async search({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(ragSearchValidator)

    try {
      return {
        data: await this.rag.search({
          userId: auth.getUserOrFail().id,
          searchText: payload.searchText,
          spaceId: payload.spaceId,
          limit: payload.limit,
        }),
      }
    } catch (error) {
      if (error instanceof RagRetrievalFailedError) {
        return response.status(error.status).send(
          toApiErrorResponse({
            code: error.code,
            message: error.message,
          })
        )
      }

      throw error
    }
  }

  async chat({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(ragChatValidator)
    const abort = new AbortController()
    const rawResponse = (response as unknown as { response?: NodeJS.EventEmitter }).response
    rawResponse?.once('close', () => abort.abort())

    let events: AsyncIterable<RagStreamEvent>

    try {
      events = await this.rag.prepareChat({
        userId: auth.getUserOrFail().id,
        message: payload.message,
        spaceId: payload.spaceId,
        topK: payload.topK,
        signal: abort.signal,
      })
    } catch (error) {
      if (error instanceof RagSearchForbiddenError) {
        return response.status(error.status).send(toApiErrorResponse(apiErrors.forbidden))
      }

      if (error instanceof RagRetrievalFailedError) {
        return response.status(error.status).send(toApiErrorResponse(apiErrors.ragRetrievalFailed))
      }

      throw error
    }

    response.header('content-type', 'text/event-stream; charset=utf-8')
    response.header('cache-control', 'no-cache')
    response.header('connection', 'keep-alive')
    response.stream(Readable.from(toSseChunks(events)))
  }
}

type SseEventEncoder = (event: RagStreamEvent) => string

/**
 * HTTP 传输层故障不能让 SSE 连接静默中断；始终以一个稳定的业务 error event 收口。
 * encoder 可替换以覆盖 JSON 序列化失败等传输适配故障。
 */
export async function* toSseChunks(
  events: AsyncIterable<RagStreamEvent>,
  encode: SseEventEncoder = encodeSseEvent
) {
  let terminalEventSent = false
  let upstreamCompleted = false
  const iterator = events[Symbol.asyncIterator]()

  try {
    while (true) {
      const { done, value: event } = await iterator.next()

      if (done) {
        upstreamCompleted = true
        return
      }

      yield encode(event)
      terminalEventSent = event.type === 'finish' || event.type === 'error'

      // 终止事件一旦写入，不再向上游请求任何事件，避免额外数据越过 SSE 协议边界。
      if (terminalEventSent) {
        return
      }
    }
  } catch {
    if (terminalEventSent) {
      return
    }

    terminalEventSent = true
    yield encodeSseEvent({
      type: 'error',
      error: {
        code: 'RAG_STREAM_FAILED',
        message: apiErrors.ragStreamFailed.message,
        retryable: true,
      },
    })
  } finally {
    if (!upstreamCompleted) {
      try {
        await iterator.return?.()
      } catch {
        // finish/error 已写入后，清理失败不能让已完成的 SSE 响应变为 rejected。
        if (!terminalEventSent) {
          terminalEventSent = true
          yield encodeSseEvent({
            type: 'error',
            error: {
              code: 'RAG_STREAM_FAILED',
              message: apiErrors.ragStreamFailed.message,
              retryable: true,
            },
          })
        }
      }
    }
  }
}

function encodeSseEvent(event: RagStreamEvent) {
  return `data: ${JSON.stringify(event)}\n\n`
}
