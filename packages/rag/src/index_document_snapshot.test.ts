import assert from 'node:assert/strict'
import test from 'node:test'
import type { RagIndexBlock } from '@docweave/contracts/rag'
import { createStablePointId, indexDocumentSnapshot } from './index_document_snapshot.js'

function paragraphBlocks(text: string) {
  return text.split('\n').map((line, index) => ({
    id: `block-${index + 1}`,
    type: 'paragraph',
    content: [{ type: 'text', text: line }],
  }))
}

test('creates citation-capable points from BlockNote blocks with complete metadata', async () => {
  let capturedPoints: Array<{ id: string; payload: Record<string, unknown> }> = []

  await indexDocumentSnapshot(
    {
      workspaceId: 'workspace-1',
      spaceId: 'space-1',
      documentId: 'doc-citation',
      snapshotVersion: 9,
      blocks: [
        {
          id: 'heading-1',
          type: 'heading',
          props: { level: 2 },
          content: [{ type: 'text', text: 'Architecture' }],
        },
        {
          id: 'paragraph-1',
          type: 'paragraph',
          content: [{ type: 'text', text: 'Block-aware indexing keeps citations traceable.' }],
        },
        {
          id: 'empty-1',
          type: 'paragraph',
          content: [],
        },
      ],
    },
    {
      embeddingDimensions: 2,
      async embed(texts) {
        return texts.map(() => [1, 2])
      },
      async ensureCollectionDimensions() {},
      async upsert(points) {
        capturedPoints = points
      },
      async canPublish() {
        return true
      },
    },
  )

  assert.equal(capturedPoints.length, 2)
  assert.deepEqual(capturedPoints[1]!.payload, {
    workspaceId: 'workspace-1',
    spaceId: 'space-1',
    documentId: 'doc-citation',
    snapshotVersion: 9,
    blockId: 'paragraph-1',
    chunkId: 'paragraph-1:0',
    headingPath: ['Architecture'],
    plainText: 'Block-aware indexing keeps citations traceable.',
  })
  assert.notEqual(capturedPoints[0]!.id, capturedPoints[1]!.id)
})

test('does not create points for blocks without usable text', async () => {
  let upserted = false

  const result = await indexDocumentSnapshot(
    {
      workspaceId: 'workspace-1',
      spaceId: 'space-1',
      documentId: 'doc-empty',
      snapshotVersion: 1,
      blocks: [{ id: 'empty-block', type: 'paragraph', content: [] }],
    },
    {
      embeddingDimensions: 2,
      async embed() {
        throw new Error('empty blocks must not be embedded')
      },
      async ensureCollectionDimensions() {},
      async upsert() {
        upserted = true
      },
      async canPublish() {
        return true
      },
    },
  )

  assert.equal(result.chunkCount, 0)
  assert.equal(upserted, false)
})

test('splits embedding calls into batches of at most 10 texts', async () => {
  const calls: string[][] = []

  const result = await indexDocumentSnapshot(
    {
      workspaceId: 'workspace-1',
      spaceId: 'space-1',
      documentId: 'doc-1',
      snapshotVersion: 3,
      blocks: paragraphBlocks(
        Array.from({ length: 23 }, (_, index) => `chunk-${index + 1}`).join('\n'),
      ),
    },
    {
      embeddingDimensions: 3,
      async embed(texts) {
        calls.push(texts)
        return texts.map(() => [1, 2, 3])
      },
      async ensureCollectionDimensions() {},
      async upsert() {},
      async canPublish() {
        return true
      },
    },
  )

  assert.deepEqual(calls.map((batch) => batch.length), [10, 10, 3])
  assert.equal(result.chunkCount, 23)
  assert.equal(result.status, 'published')
})

test('fails before writes when embedding dimensions do not match the configured collection', async () => {
  let upserted = false

  await assert.rejects(
    () =>
      indexDocumentSnapshot(
        {
          workspaceId: 'workspace-1',
          spaceId: 'space-1',
          documentId: 'doc-2',
          snapshotVersion: 4,
          blocks: paragraphBlocks('alpha\nbeta'),
        },
        {
          embeddingDimensions: 1536,
          async embed(texts) {
            return texts.map(() => [1, 2])
          },
          async ensureCollectionDimensions() {},
          async upsert() {
            upserted = true
          },
          async canPublish() {
            return true
          },
        },
      ),
    /Embedding dimensions mismatch/,
  )

  assert.equal(upserted, false)
})

test('returns superseded when publish gate rejects the snapshot version', async () => {
  const result = await indexDocumentSnapshot(
    {
      workspaceId: 'workspace-1',
      spaceId: 'space-1',
      documentId: 'doc-3',
      snapshotVersion: 2,
      blocks: paragraphBlocks('alpha\nbeta'),
    },
    {
      embeddingDimensions: 2,
      async embed(texts) {
        return texts.map(() => [1, 2])
      },
      async ensureCollectionDimensions() {},
      async upsert() {},
      async canPublish() {
        return false
      },
    },
  )

  assert.equal(result.status, 'superseded')
})

test('uses stable UUID-like point ids so qdrant accepts upserts', async () => {
  var capturedPoints: Array<{ id: string }> = []

  await indexDocumentSnapshot(
    {
      workspaceId: 'workspace-1',
      spaceId: 'space-1',
      documentId: 'doc-4',
      snapshotVersion: 7,
      blocks: paragraphBlocks('alpha\nbeta'),
    },
    {
      embeddingDimensions: 2,
      async embed(texts) {
        return texts.map(() => [1, 2])
      },
      async ensureCollectionDimensions() {},
      async upsert(points) {
        capturedPoints = points
      },
      async canPublish() {
        return true
      },
    },
  )

  assert.match(
    capturedPoints[0]!.id,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  )
  assert.equal(capturedPoints[0]!.id, capturedPoints[0]!.id)
  assert.notEqual(capturedPoints[0]!.id, capturedPoints[1]!.id)
})

test('changes the stable point id for every document, snapshot, block, and chunk identity part', async () => {
  const baseline: RagIndexBlock = {
    workspaceId: 'workspace-1',
    spaceId: 'space-1',
    documentId: 'doc-1',
    snapshotVersion: 1,
    blockId: 'block-1',
    chunkId: 'block-1:0',
    headingPath: [],
    plainText: 'Stable point identity.',
  }
  const baselineId = createStablePointId(baseline)

  assert.notEqual(createStablePointId({ ...baseline, documentId: 'doc-2' }), baselineId)
  assert.notEqual(createStablePointId({ ...baseline, snapshotVersion: 2 }), baselineId)
  assert.notEqual(createStablePointId({ ...baseline, blockId: 'block-2' }), baselineId)
  assert.notEqual(createStablePointId({ ...baseline, chunkId: 'block-1:1' }), baselineId)
})
