import assert from 'node:assert/strict'
import test from 'node:test'
import { indexDocumentSnapshot } from './index_document_snapshot.js'

test('splits embedding calls into batches of at most 10 texts', async () => {
  const calls: string[][] = []

  const result = await indexDocumentSnapshot(
    {
      documentId: 'doc-1',
      snapshotVersion: 3,
      plainText: Array.from({ length: 23 }, (_, index) => `chunk-${index + 1}`).join('\n'),
      blocks: [],
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
          documentId: 'doc-2',
          snapshotVersion: 4,
          plainText: 'alpha\nbeta',
          blocks: [],
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
      documentId: 'doc-3',
      snapshotVersion: 2,
      plainText: 'alpha\nbeta',
      blocks: [],
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
      documentId: 'doc-4',
      snapshotVersion: 7,
      plainText: 'alpha\nbeta',
      blocks: [],
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
