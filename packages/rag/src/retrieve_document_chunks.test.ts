import assert from 'node:assert/strict'
import test from 'node:test'
import type { RagRetrievalScope } from '@docweave/contracts/rag'
import { retrieveDocumentChunks } from './retrieve_document_chunks.js'

const scope: RagRetrievalScope = {
  documents: [
    {
      workspaceId: 'workspace-1',
      spaceId: 'space-a',
      documentId: 'doc-a',
      latestIndexedVersion: 3,
    },
    {
      workspaceId: 'workspace-1',
      spaceId: 'space-b',
      documentId: 'doc-b',
      latestIndexedVersion: 7,
    },
    {
      workspaceId: 'workspace-1',
      spaceId: 'space-a',
      documentId: 'doc-unindexed',
      latestIndexedVersion: null,
    },
  ],
}

test('returns only complete, authorized points at each document active indexed version', async () => {
  let backendRequest: unknown

  const hits = await retrieveDocumentChunks(
    { queryVector: [0.1, 0.2], scope, limit: 2 },
    {
      async search(request) {
        backendRequest = request
        return [
          {
            score: 0.99,
            payload: {
              workspaceId: 'workspace-1',
              spaceId: 'space-a',
              documentId: 'doc-a',
              snapshotVersion: 3,
              blockId: 'block-a',
              chunkId: 'block-a:0',
              headingPath: ['Architecture'],
              plainText: 'Authorized current content.',
            },
          },
          {
            score: 0.98,
            payload: {
              workspaceId: 'workspace-1',
              spaceId: 'space-a',
              documentId: 'doc-a',
              snapshotVersion: 2,
              blockId: 'stale-block',
              chunkId: 'stale-block:0',
              headingPath: [],
              plainText: 'Stale content.',
            },
          },
          {
            score: 0.97,
            payload: {
              workspaceId: 'workspace-1',
              spaceId: 'space-b',
              documentId: 'doc-b',
              snapshotVersion: 7,
              blockId: 'block-b',
              chunkId: 'block-b:0',
              headingPath: [],
              plainText: 'Another authorized document.',
            },
          },
          {
            score: 0.96,
            payload: {
              workspaceId: 'workspace-1',
              spaceId: 'space-a',
              documentId: 'doc-unindexed',
              snapshotVersion: 1,
              blockId: 'block-unindexed',
              chunkId: 'block-unindexed:0',
              headingPath: [],
              plainText: 'Must not be searched.',
            },
          },
          {
            score: 0.95,
            payload: {
              documentId: 'doc-a',
              snapshotVersion: 3,
              plainText: 'Old incomplete point must not receive a fabricated citation.',
            },
          },
          {
            score: 0.94,
            payload: {
              workspaceId: 'workspace-1',
              spaceId: 'space-a',
              documentId: 'doc-not-authorized',
              snapshotVersion: 1,
              blockId: 'block-secret',
              chunkId: 'block-secret:0',
              headingPath: [],
              plainText: 'Unauthorized content.',
            },
          },
        ]
      },
    },
  )

  assert.deepEqual(backendRequest, {
    queryVector: [0.1, 0.2],
    documents: [
      { documentId: 'doc-a', snapshotVersion: 3 },
      { documentId: 'doc-b', snapshotVersion: 7 },
    ],
    limit: 2,
  })
  assert.deepEqual(hits, [
    {
      score: 0.99,
      snippet: 'Authorized current content.',
      citation: {
        id: 'doc-a:3:block-a:block-a:0',
        documentId: 'doc-a',
        snapshotVersion: 3,
        blockId: 'block-a',
        chunkId: 'block-a:0',
        quote: 'Authorized current content.',
      },
    },
    {
      score: 0.97,
      snippet: 'Another authorized document.',
      citation: {
        id: 'doc-b:7:block-b:block-b:0',
        documentId: 'doc-b',
        snapshotVersion: 7,
        blockId: 'block-b',
        chunkId: 'block-b:0',
        quote: 'Another authorized document.',
      },
    },
  ])
})

test('narrows the authorized scope by its optional space filter before querying the backend', async () => {
  const hits = await retrieveDocumentChunks(
    { queryVector: [1], scope: { ...scope, spaceId: 'space-a' } },
    {
      async search(request) {
        assert.deepEqual(request.documents, [{ documentId: 'doc-a', snapshotVersion: 3 }])
        return []
      },
    },
  )

  assert.deepEqual(hits, [])
})

test('does not query the backend when no authorized document has an active indexed version', async () => {
  let called = false

  const hits = await retrieveDocumentChunks(
    {
      queryVector: [1],
      scope: {
        documents: [
          {
            workspaceId: 'workspace-1',
            spaceId: 'space-a',
            documentId: 'doc-unindexed',
            latestIndexedVersion: null,
          },
        ],
      },
    },
    {
      async search() {
        called = true
        return []
      },
    },
  )

  assert.equal(called, false)
  assert.deepEqual(hits, [])
})

test('keeps the returned hits bounded when the backend returns extra valid candidates', async () => {
  const hits = await retrieveDocumentChunks(
    { queryVector: [1], scope, limit: 1 },
    {
      async search() {
        return [
          {
            score: 0.8,
            payload: {
              workspaceId: 'workspace-1',
              spaceId: 'space-a',
              documentId: 'doc-a',
              snapshotVersion: 3,
              blockId: 'block-a',
              chunkId: 'block-a:0',
              headingPath: [],
              plainText: 'First result.',
            },
          },
          {
            score: 0.9,
            payload: {
              workspaceId: 'workspace-1',
              spaceId: 'space-b',
              documentId: 'doc-b',
              snapshotVersion: 7,
              blockId: 'block-b',
              chunkId: 'block-b:0',
              headingPath: [],
              plainText: 'Second result.',
            },
          },
        ]
      },
    },
  )

  assert.deepEqual(hits.map((hit) => hit.snippet), ['Second result.'])
})

test('rejects candidates with blank citation fields or non-positive integer snapshot versions', async () => {
  const validPayload = {
    workspaceId: 'workspace-1',
    spaceId: 'space-a',
    documentId: 'doc-a',
    snapshotVersion: 3,
    blockId: 'block-a',
    chunkId: 'block-a:0',
    headingPath: [],
    plainText: 'Valid content.',
  }
  const invalidPayloads = [
    { ...validPayload, workspaceId: ' ' },
    { ...validPayload, spaceId: '' },
    { ...validPayload, documentId: '\t' },
    { ...validPayload, blockId: '' },
    { ...validPayload, chunkId: ' ' },
    { ...validPayload, plainText: '  ' },
    { ...validPayload, snapshotVersion: 0 },
    { ...validPayload, snapshotVersion: -1 },
    { ...validPayload, snapshotVersion: 3.5 },
  ]

  const hits = await retrieveDocumentChunks(
    { queryVector: [1], scope },
    {
      async search() {
        return invalidPayloads.map((payload, index) => ({ score: 1 - index / 10, payload }))
      },
    },
  )

  assert.deepEqual(hits, [])
})

test('does not query the backend for zero, negative, or fractional active indexed versions', async () => {
  let called = false

  const hits = await retrieveDocumentChunks(
    {
      queryVector: [1],
      scope: {
        documents: [
          { workspaceId: 'workspace-1', spaceId: 'space-a', documentId: 'doc-zero', latestIndexedVersion: 0 },
          { workspaceId: 'workspace-1', spaceId: 'space-a', documentId: 'doc-negative', latestIndexedVersion: -1 },
          { workspaceId: 'workspace-1', spaceId: 'space-a', documentId: 'doc-fractional', latestIndexedVersion: 1.5 },
        ],
      },
    },
    {
      async search() {
        called = true
        return []
      },
    },
  )

  assert.equal(called, false)
  assert.deepEqual(hits, [])
})
