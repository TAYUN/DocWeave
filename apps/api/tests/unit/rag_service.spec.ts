import assert from 'node:assert/strict'
import { test } from '@japa/runner'
import RagService, { RagRetrievalFailedError, RagSearchForbiddenError } from '#services/rag_service'

test.group('RagService search', () => {
  test('does not embed or retrieve when editor searches an existing architecture space', async () => {
    let embedCalls = 0
    let retrievalCalls = 0
    const service = new RagService({
      async listVisibleDocuments() {
        return [
          {
            workspaceId: 'product',
            spaceId: 'product',
            documentId: 'product-doc',
            latestIndexedVersion: 3,
          },
        ]
      },
      async hasSpaceAccess(_userId, spaceId) {
        return spaceId === 'product'
      },
      async embedQuery() {
        embedCalls += 1
        return [0.1, 0.2]
      },
      async retrieve() {
        retrievalCalls += 1
        return []
      },
    })

    await assert.rejects(
      () =>
        service.search({
          userId: 101,
          searchText: 'architecture',
          spaceId: 'architecture',
        }),
      RagSearchForbiddenError
    )
    assert.equal(embedCalls, 0)
    assert.equal(retrievalCalls, 0)
  })

  test('returns an empty response without embedding when no active indexed document is visible', async () => {
    let embedCalls = 0
    const service = new RagService({
      async listVisibleDocuments() {
        return [
          {
            workspaceId: 'space-a',
            spaceId: 'space-a',
            documentId: 'doc-a',
            latestIndexedVersion: null,
          },
        ]
      },
      async hasSpaceAccess() {
        return true
      },
      async embedQuery() {
        embedCalls += 1
        return [0.1, 0.2]
      },
      async retrieve() {
        throw new Error('retrieval must not run')
      },
    })

    assert.deepEqual(await service.search({ userId: 1, searchText: 'architecture' }), {
      searchText: 'architecture',
      hits: [],
    })
    assert.equal(embedCalls, 0)
  })

  test('uses the membership-derived document scope for each user', async () => {
    const scopes: Array<{ userId: number; documentIds: string[] }> = []
    const service = new RagService({
      async hasSpaceAccess() {
        return true
      },
      async listVisibleDocuments(userId) {
        if (userId === 101) {
          return [
            {
              workspaceId: 'product',
              spaceId: 'product',
              documentId: 'product-doc',
              latestIndexedVersion: 1,
            },
          ]
        }

        return [
          {
            workspaceId: 'product',
            spaceId: 'product',
            documentId: 'product-doc',
            latestIndexedVersion: 1,
          },
          {
            workspaceId: 'architecture',
            spaceId: 'architecture',
            documentId: 'architecture-doc',
            latestIndexedVersion: 1,
          },
        ]
      },
      async embedQuery() {
        return [0.1, 0.2]
      },
      async retrieve({ scope }) {
        scopes.push({
          userId: scope.documents.length === 1 ? 101 : 100,
          documentIds: scope.documents.map((document) => document.documentId),
        })
        return []
      },
    })

    await service.search({ userId: 101, searchText: 'product' })
    await service.search({ userId: 100, searchText: 'architecture' })

    assert.deepEqual(scopes, [
      { userId: 101, documentIds: ['product-doc'] },
      { userId: 100, documentIds: ['product-doc', 'architecture-doc'] },
    ])
  })
})

test.group('RagService chat stream', () => {
  test('emits stable business events in order after authorized retrieval', async () => {
    const service = new RagService({
      async hasSpaceAccess() {
        return true
      },
      async listVisibleDocuments() {
        return [
          {
            workspaceId: 'product',
            spaceId: 'product',
            documentId: 'product-doc',
            latestIndexedVersion: 1,
          },
        ]
      },
      async embedQuery() {
        return [0.1]
      },
      async retrieve() {
        return [
          {
            score: 0.9,
            snippet: 'Product roadmap',
            citation: {
              id: 'c1',
              documentId: 'product-doc',
              snapshotVersion: 1,
              blockId: 'roadmap',
            },
          },
        ]
      },
      async *streamAnswer() {
        yield 'The roadmap is ready.'
      },
    })

    const events = await collectEvents(
      await service.prepareChat({ userId: 1, message: 'What is the roadmap?' })
    )

    assert.deepEqual(
      events.map((event) => event.type),
      ['start', 'retrieval', 'text-delta', 'citation', 'finish']
    )
    assert.deepEqual(events[1], {
      type: 'retrieval',
      citations: [
        {
          id: 'c1',
          documentId: 'product-doc',
          snapshotVersion: 1,
          blockId: 'roadmap',
        },
      ],
    })
  })

  test('raises retrieval errors before streaming and emits a generation error without finish', async () => {
    const retrievalFailure = new RagService({
      async hasSpaceAccess() {
        return true
      },
      async listVisibleDocuments() {
        return [
          {
            workspaceId: 'product',
            spaceId: 'product',
            documentId: 'product-doc',
            latestIndexedVersion: 1,
          },
        ]
      },
      async embedQuery() {
        throw new Error('Qdrant unavailable')
      },
      async retrieve() {
        return []
      },
    })

    await assert.rejects(
      () => retrievalFailure.prepareChat({ userId: 1, message: 'What is the roadmap?' }),
      RagRetrievalFailedError
    )

    const generationFailure = new RagService({
      async hasSpaceAccess() {
        return true
      },
      async listVisibleDocuments() {
        return []
      },
      async embedQuery() {
        return [0.1]
      },
      async retrieve() {
        return []
      },
      async *streamAnswer() {
        throw new Error('model unavailable')
      },
    })

    const events = await collectEvents(
      await generationFailure.prepareChat({ userId: 1, message: 'What is the roadmap?' })
    )

    assert.deepEqual(
      events.map((event) => event.type),
      ['start', 'retrieval', 'error']
    )
    assert.deepEqual(events.at(-1), {
      type: 'error',
      error: {
        code: 'RAG_GENERATION_FAILED',
        message: '知识问答生成暂时不可用，请稍后重试',
        retryable: true,
      },
    })
  })

  test('converts async iterator creation failures into a generation error without finish', async () => {
    const service = new RagService({
      async hasSpaceAccess() {
        return true
      },
      async listVisibleDocuments() {
        return []
      },
      async embedQuery() {
        return [0.1]
      },
      async retrieve() {
        return []
      },
      streamAnswer() {
        return {
          [Symbol.asyncIterator]() {
            throw new Error('iterator setup failed')
          },
        } as AsyncIterable<string>
      },
    })

    const events = await collectEvents(
      await service.prepareChat({ userId: 1, message: 'What is the roadmap?' })
    )

    assert.deepEqual(
      events.map((event) => event.type),
      ['start', 'retrieval', 'error']
    )
    assert.equal(events.at(-1)?.type, 'error')
  })

  test('stops model forwarding on abort and finishes as cancelled', async () => {
    const controller = new AbortController()
    let returnCalls = 0
    const answer: AsyncIterator<string> & AsyncIterable<string> = {
      async next(): Promise<IteratorResult<string>> {
        controller.abort()
        return { done: false as const, value: 'ignored' }
      },
      async return(): Promise<IteratorResult<string>> {
        returnCalls += 1
        return { done: true as const, value: undefined }
      },
      [Symbol.asyncIterator]() {
        return this
      },
    }
    const service = new RagService({
      async hasSpaceAccess() {
        return true
      },
      async listVisibleDocuments() {
        return []
      },
      async embedQuery() {
        return [0.1]
      },
      async retrieve() {
        return []
      },
      streamAnswer() {
        return answer
      },
    })

    const events = await collectEvents(
      await service.prepareChat({
        userId: 1,
        message: 'What is the roadmap?',
        signal: controller.signal,
      })
    )

    assert.deepEqual(
      events.map((event) => event.type),
      ['start', 'retrieval', 'finish']
    )
    assert.deepEqual(events.at(-1), {
      type: 'finish',
      finishReason: 'cancelled',
      citations: [],
      usage: null,
    })
    assert.equal(returnCalls, 1)
  })

  test('finishes as cancelled when the provider aborts while forwarding', async () => {
    const controller = new AbortController()
    const service = new RagService({
      async hasSpaceAccess() {
        return true
      },
      async listVisibleDocuments() {
        return []
      },
      async embedQuery() {
        return [0.1]
      },
      async retrieve() {
        return []
      },
      async *streamAnswer() {
        controller.abort()
        throw new Error('The operation was aborted')
      },
    })

    const events = await collectEvents(
      await service.prepareChat({
        userId: 1,
        message: 'What is the roadmap?',
        signal: controller.signal,
      })
    )

    assert.deepEqual(
      events.map((event) => event.type),
      ['start', 'retrieval', 'finish']
    )
    const finish = events.at(-1)
    assert.ok(finish && finish.type === 'finish')
    assert.equal(finish.finishReason, 'cancelled')
  })
})

async function collectEvents<T>(events: AsyncIterable<T>) {
  const result: T[] = []

  for await (const event of events) {
    result.push(event)
  }

  return result
}
