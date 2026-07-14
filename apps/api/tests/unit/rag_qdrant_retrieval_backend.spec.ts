import assert from 'node:assert/strict'
import { test } from '@japa/runner'
import { QdrantRagRetrievalBackend } from '#services/rag_qdrant_retrieval_backend'

type QdrantSearchInput = {
  vector: number[]
  limit?: number
  with_payload: boolean
  filter: unknown
}

test.group('Qdrant RAG retrieval backend', () => {
  test('maps authorized document versions to an OR filter and retains payloads', async () => {
    let request: unknown
    const backend = new QdrantRagRetrievalBackend('document_chunks_v1', {
      async search(_collection: string, input: QdrantSearchInput) {
        request = input
        return [{ score: 0.8, payload: { documentId: 'doc-a' } }]
      },
    } as never)

    const candidates = await backend.search({
      queryVector: [0.1, 0.2],
      documents: [
        { documentId: 'doc-a', snapshotVersion: 3 },
        { documentId: 'doc-b', snapshotVersion: 7 },
      ],
      limit: 5,
    })

    assert.deepEqual(candidates, [{ score: 0.8, payload: { documentId: 'doc-a' } }])
    assert.deepEqual(request, {
      vector: [0.1, 0.2],
      limit: 5,
      with_payload: true,
      filter: {
        should: [
          {
            must: [
              { key: 'documentId', match: { value: 'doc-a' } },
              { key: 'snapshotVersion', match: { value: 3 } },
            ],
          },
          {
            must: [
              { key: 'documentId', match: { value: 'doc-b' } },
              { key: 'snapshotVersion', match: { value: 7 } },
            ],
          },
        ],
      },
    })
  })
})
