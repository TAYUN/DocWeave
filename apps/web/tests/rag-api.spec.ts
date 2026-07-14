import assert from 'node:assert/strict'
import test from 'node:test'
import type { DocumentProcessingStatusDto } from '@docweave/contracts/document'
import { parseRagSseFrame, streamRagChat } from '../src/lib/api.ts'
import { getRagIndexState, toRagChatViewModel, toRagSearchViewModel } from '../src/features/rag/lib/index.ts'
import { toRagAnswerParts } from '../src/features/rag/rag-answer-parts.ts'

test('parses one JSON data frame and ignores frames without data', () => {
  assert.deepEqual(
    parseRagSseFrame('event: message\ndata: {"type":"text-delta","delta":"答案"}'),
    { type: 'text-delta', delta: '答案' },
  )
  assert.equal(parseRagSseFrame(': heartbeat'), null)
})

test('consumes fragmented SSE frames and accepts a finish frame at EOF', async () => {
  await withMockedFetch(
    responseFromChunks([
      'data: {"type":"start","messageId":"m1"}\n\n',
      'data: {"type":"text-delta","delta":"答',
      '案"}\n\n',
      'data: {"type":"finish","finishReason":"stop","citations":[],"usage":null}',
    ]),
    async () => {
      const events: unknown[] = []

      await streamRagChat({ message: '问题' }, { onEvent: (event) => events.push(event) })

      assert.deepEqual(events, [
        { type: 'start', messageId: 'm1' },
        { type: 'text-delta', delta: '答案' },
        { type: 'finish', finishReason: 'stop', citations: [], usage: null },
      ])
    },
  )
})

test('accepts an error frame at EOF as the only terminal stream event', async () => {
  await withMockedFetch(
    responseFromChunks([
      'data: {"type":"error","error":{"code":"RAG_PERMISSION_DENIED","message":"无权限","retryable":false}}',
    ]),
    async () => {
      const events: unknown[] = []

      await streamRagChat({ message: '问题' }, { onEvent: (event) => events.push(event) })

      assert.deepEqual(events, [
        {
          type: 'error',
          error: { code: 'RAG_PERMISSION_DENIED', message: '无权限', retryable: false },
        },
      ])
    },
  )
})

test('passes AbortController signal to fetch and does not synthesize a terminal event', async () => {
  const abort = new AbortController()
  let observedSignal: AbortSignal | null = null
  const originalFetch = globalThis.fetch

  globalThis.fetch = async (_input, init) => {
    observedSignal = init?.signal ?? null
    return new Response(
      new ReadableStream({
        start(controller) {
          abort.signal.addEventListener('abort', () => {
            controller.error(new DOMException('cancelled', 'AbortError'))
          })
        },
      }),
    )
  }

  try {
    const events: unknown[] = []
    const streaming = streamRagChat({ message: '问题' }, { signal: abort.signal, onEvent: (event) => events.push(event) })
    abort.abort()

    await assert.rejects(streaming, { name: 'AbortError' })
    assert.equal(observedSignal, abort.signal)
    assert.deepEqual(events, [])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('maps no-index only from explicit page status and maps stream permission denial to restricted', () => {
  assert.equal(
    toRagSearchViewModel({
      status: 'success',
      response: { searchText: '问题', hits: [] },
    }).state,
    'empty',
  )
  assert.equal(toRagSearchViewModel({ status: 'no-index', searchText: '问题' }).state, 'no-index')
  const restricted = toRagChatViewModel({
      status: 'failed',
      events: [
        { type: 'text-delta', delta: '不应继续显示的回答' },
        {
          type: 'error',
          error: { code: 'RAG_PERMISSION_DENIED', message: '无权限', retryable: false },
        },
      ],
      error: new Error('fallback'),
    })

  assert.equal(restricted.state, 'restricted')
  assert.equal(restricted.answer, '')
  assert.deepEqual(restricted.citations, [])
})

test('prioritizes shell and document-status loading failures over index availability', () => {
  const documents = [{ spaceId: 'space-1', latestIndexedVersion: null }]

  assert.equal(
    getRagIndexState(documents, { spaceId: null, pending: true, error: null }),
    'loading',
  )
  assert.equal(
    getRagIndexState(documents, { spaceId: null, pending: false, error: new Error('加载失败') }),
    'failed',
  )
  assert.equal(
    getRagIndexState(documents, { spaceId: null, pending: false, error: null, statusesPending: true }),
    'loading',
  )
  assert.equal(
    getRagIndexState(documents, {
      spaceId: null,
      pending: false,
      error: null,
      statusesError: new Error('状态加载失败'),
    }),
    'failed',
  )
  assert.equal(
    getRagIndexState(documents, {
      spaceId: null,
      pending: false,
      error: null,
      statuses: [processingStatus({ latestIndexedVersion: null })],
    }),
    'no-index',
  )
})

test('returns failed-index when a visible document latest index job failed without a published index', () => {
  const documents = [
    { id: 'failed-doc', spaceId: 'space-1', latestIndexedVersion: null },
    { id: 'ready-doc', spaceId: 'space-1', latestIndexedVersion: 2 },
  ]

  assert.equal(
    getRagIndexState(documents, {
      spaceId: 'space-1',
      pending: false,
      error: null,
      statuses: [
        processingStatus({
          documentId: 'failed-doc',
          latestIndexedVersion: null,
          latestIndexJob: {
            id: 'job-1',
            documentId: 'failed-doc',
            targetSnapshotVersion: 1,
            status: 'failed',
            stage: 'embedding',
            requestedByUserId: 1,
            attemptCount: 1,
            errorCode: 'EMBEDDING_FAILED',
            errorMessage: '向量服务不可用',
            createdAt: null,
            startedAt: null,
            finishedAt: null,
          },
        }),
        processingStatus({ documentId: 'ready-doc', latestIndexedVersion: 2 }),
      ],
    }),
    'failed-index',
  )
})

test('only evaluates document processing statuses within the selected visible space', () => {
  const documents = [
    { id: 'product-doc', spaceId: 'product', latestIndexedVersion: 1 },
    { id: 'architecture-doc', spaceId: 'architecture', latestIndexedVersion: null },
  ]

  assert.equal(
    getRagIndexState(documents, {
      spaceId: 'product',
      pending: false,
      error: null,
      statuses: [
        processingStatus({ documentId: 'product-doc', latestIndexedVersion: 1 }),
        processingStatus({
          documentId: 'architecture-doc',
          latestIndexJob: {
            id: 'job-2',
            documentId: 'architecture-doc',
            targetSnapshotVersion: 1,
            status: 'failed',
            stage: 'upserting',
            requestedByUserId: 1,
            attemptCount: 1,
            errorCode: 'QDRANT_UNAVAILABLE',
            errorMessage: '索引服务不可用',
            createdAt: null,
            startedAt: null,
            finishedAt: null,
          },
        }),
      ],
    }),
    'ready',
  )
})

test('replaces only known verbose Citation IDs with compact answer references', () => {
  const citations = [
    {
      id: 'rag-evaluation-playbook:2:a9453816-504d-4f3f-ab62-647a89a391ce:0',
      documentId: 'rag-evaluation-playbook',
      snapshotVersion: 2,
      blockId: 'a9453816-504d-4f3f-ab62-647a89a391ce',
      quote: 'RAG evidence',
    },
  ]

  assert.deepEqual(
    toRagAnswerParts(
      '结论有据 [rag-evaluation-playbook:2:a9453816-504d-4f3f-ab62-647a89a391ce:0]，保留 [不应替换]。',
      citations,
    ),
    [
      { type: 'text', value: '结论有据 ' },
      { type: 'citation', citation: citations[0], index: 1 },
      { type: 'text', value: '，保留 [不应替换]。' },
    ],
  )
})

test('recognizes the model Citation shorthand that omits the repeated block ID', () => {
  const citations = [
    {
      id: 'rag-evaluation-playbook:2:c200729c-2be4-4cad-989b-873274d4ac7d:c200729c-2be4-4cad-989b-873274d4ac7d:0',
      documentId: 'rag-evaluation-playbook',
      snapshotVersion: 2,
      blockId: 'c200729c-2be4-4cad-989b-873274d4ac7d',
      quote: '检索指标',
    },
  ]

  assert.deepEqual(
    toRagAnswerParts(
      '应避免平均分掩盖关键失败 [rag-evaluation-playbook:2:c200729c-2be4-4cad-989b-873274d4ac7d:0]。',
      citations,
    ),
    [
      { type: 'text', value: '应避免平均分掩盖关键失败 ' },
      { type: 'citation', citation: citations[0], index: 1 },
      { type: 'text', value: '。' },
    ],
  )
})

function processingStatus(
  overrides: Partial<DocumentProcessingStatusDto> = {},
): DocumentProcessingStatusDto {
  return {
    documentId: 'document-1',
    latestSnapshotVersion: null,
    latestIndexedVersion: null,
    latestSnapshot: null,
    latestIndexJob: null,
    ...overrides,
  }
}

function responseFromChunks(chunks: string[]) {
  const encoder = new TextEncoder()
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
        controller.close()
      },
    }),
  )
}

async function withMockedFetch(response: Response, callback: () => Promise<void>) {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => response

  try {
    await callback()
  } finally {
    globalThis.fetch = originalFetch
  }
}
