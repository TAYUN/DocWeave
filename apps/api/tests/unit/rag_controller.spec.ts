import assert from 'node:assert/strict'
import { test } from '@japa/runner'
import type { RagStreamEvent } from '@docweave/contracts/rag'
import RagController, { toSseChunks } from '#controllers/rag_controller'
import { RagRetrievalFailedError, RagSearchForbiddenError } from '#services/rag_service'

test.group('RagController chat stream', () => {
  test('sends a shared forbidden envelope before starting the stream', async () => {
    const controller = new RagController({
      async prepareChat() {
        throw new RagSearchForbiddenError()
      },
    } as never)
    const response = createResponse()

    await controller.chat({
      auth: { getUserOrFail: () => ({ id: 1 }) },
      request: {
        validateUsing: async () => ({ message: 'restricted', spaceId: 'architecture' }),
      },
      response,
    } as never)

    assert.equal(response.statusCode, 403)
    assert.deepEqual(response.body, {
      code: 'AUTH_FORBIDDEN',
      message: '没有权限执行该操作',
    })
    assert.equal(response.streamed, null)
  })

  test('sends a shared retrieval envelope before starting the stream', async () => {
    const controller = new RagController({
      async prepareChat() {
        throw new RagRetrievalFailedError()
      },
    } as never)
    const response = createResponse()

    await controller.chat({
      auth: { getUserOrFail: () => ({ id: 1 }) },
      request: {
        validateUsing: async () => ({ message: 'question' }),
      },
      response,
    } as never)

    assert.equal(response.statusCode, 502)
    assert.deepEqual(response.body, {
      code: 'RAG_RETRIEVAL_FAILED',
      message: '知识检索暂时不可用，请稍后重试',
    })
    assert.equal(response.streamed, null)
  })

  test('adapts domain events to an SSE response', async () => {
    const controller = new RagController({
      async prepareChat() {
        return events([
          { type: 'start', messageId: 'message-1' },
          { type: 'retrieval', citations: [] },
          { type: 'text-delta', delta: 'Answer' },
          { type: 'finish', finishReason: 'stop', citations: [], usage: null },
        ])
      },
    } as never)
    const response = createResponse()

    await controller.chat({
      auth: { getUserOrFail: () => ({ id: 1 }) },
      request: {
        validateUsing: async () => ({ message: 'question' }),
      },
      response,
    } as never)

    assert.equal(response.headers.get('content-type'), 'text/event-stream; charset=utf-8')
    assert.equal(response.headers.get('cache-control'), 'no-cache')
    assert.deepEqual(await readChunks(response.streamed), [
      'data: {"type":"start","messageId":"message-1"}\n\n',
      'data: {"type":"retrieval","citations":[]}\n\n',
      'data: {"type":"text-delta","delta":"Answer"}\n\n',
      'data: {"type":"finish","finishReason":"stop","citations":[],"usage":null}\n\n',
    ])
  })

  test('converts iterator and encoder failures into one stream error without finish', async () => {
    const iteratorFailure = async function* () {
      throw new Error('upstream stream failed')
    }
    const encoderFailure = () => {
      throw new Error('serialization failed')
    }

    assert.deepEqual(await readChunks(toSseChunks(iteratorFailure())), [
      'data: {"type":"error","error":{"code":"RAG_STREAM_FAILED","message":"知识问答流暂时不可用，请稍后重试","retryable":true}}\n\n',
    ])
    assert.deepEqual(
      await readChunks(
        toSseChunks(events([{ type: 'start', messageId: 'message-1' }]), encoderFailure)
      ),
      [
        'data: {"type":"error","error":{"code":"RAG_STREAM_FAILED","message":"知识问答流暂时不可用，请稍后重试","retryable":true}}\n\n',
      ]
    )
  })

  test('does not emit a stream error when iteration fails after finish', async () => {
    const finishThenFails = async function* () {
      yield { type: 'finish' as const, finishReason: 'stop' as const, citations: [], usage: null }
      throw new Error('provider cleanup failed')
    }

    assert.deepEqual(await readChunks(toSseChunks(finishThenFails())), [
      'data: {"type":"finish","finishReason":"stop","citations":[],"usage":null}\n\n',
    ])
  })

  test('completes cleanly when cleanup fails after finish was written', async () => {
    let returnCalls = 0
    const upstream: AsyncIterableIterator<RagStreamEvent> = {
      [Symbol.asyncIterator]() {
        return this
      },
      async next(): Promise<IteratorResult<RagStreamEvent>> {
        return {
          done: false,
          value: {
            type: 'finish',
            finishReason: 'stop',
            citations: [],
            usage: null,
          },
        }
      },
      async return(): Promise<IteratorResult<RagStreamEvent>> {
        returnCalls += 1
        throw new Error('upstream cleanup failed')
      },
    }

    assert.deepEqual(await readChunks(toSseChunks(upstream)), [
      'data: {"type":"finish","finishReason":"stop","citations":[],"usage":null}\n\n',
    ])
    assert.equal(returnCalls, 1)
  })

  test('stops reading and cleans up upstream immediately after a terminal event', async () => {
    let nextCalls = 0
    let returnCalls = 0
    const upstream: AsyncIterableIterator<RagStreamEvent> = {
      [Symbol.asyncIterator]() {
        return this
      },
      async next(): Promise<IteratorResult<RagStreamEvent>> {
        nextCalls += 1

        if (nextCalls === 1) {
          return {
            done: false,
            value: {
              type: 'finish' as const,
              finishReason: 'stop' as const,
              citations: [],
              usage: null,
            },
          }
        }

        return { done: false, value: { type: 'text-delta' as const, delta: 'must not be read' } }
      },
      async return(): Promise<IteratorResult<RagStreamEvent>> {
        returnCalls += 1
        return { done: true, value: undefined }
      },
    }

    assert.deepEqual(await readChunks(toSseChunks(upstream)), [
      'data: {"type":"finish","finishReason":"stop","citations":[],"usage":null}\n\n',
    ])
    assert.equal(nextCalls, 1)
    assert.equal(returnCalls, 1)
  })
})

function createResponse() {
  const headers = new Map<string, string>()

  return {
    statusCode: 200,
    body: null as unknown,
    streamed: null as AsyncIterable<Uint8Array | string> | null,
    headers,
    status(status: number) {
      this.statusCode = status
      return this
    },
    send(body: unknown) {
      this.body = body
      return body
    },
    header(name: string, value: string) {
      headers.set(name.toLowerCase(), value)
      return this
    },
    stream(stream: AsyncIterable<Uint8Array | string>) {
      this.streamed = stream
    },
  }
}

async function* events<T>(values: T[]) {
  yield* values
}

async function readChunks(stream: AsyncIterable<Uint8Array | string> | null) {
  assert.ok(stream)
  const chunks: string[] = []

  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk))
  }

  return chunks
}
