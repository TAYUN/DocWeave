import assert from 'node:assert/strict'
import test from 'node:test'
import type { AiRuntime } from '@docweave/ai'
import type { QdrantClient } from '@qdrant/js-client-rest'
import type { Pool } from 'pg'
import type { WorkerConfig } from './config.js'
import { runDocumentIndexJobs } from './run_document_index_jobs.js'

test('loads workspace and space boundaries with the snapshot and forwards them to indexing', async () => {
  const queries: Array<{ text: string; values?: unknown[] }> = []
  let capturedPayloads: Array<Record<string, unknown>> = []
  let deleteRequest: unknown = null
  const job = { id: 'job-1', documentId: 'doc-1', targetSnapshotVersion: 4 }

  async function query(text: string, values?: unknown[]) {
    queries.push({ text, values })

    if (text.includes('from rag_index_jobs')) return { rows: [job] }
    if (text.includes('from document_snapshots as snapshots')) {
      return {
        rows: [
          {
            document_id: 'doc-1',
            workspace_id: 'workspace-1',
            space_id: 'space-1',
            content: JSON.stringify([
              {
                id: 'block-1',
                type: 'paragraph',
                content: [{ type: 'text', text: 'Indexed from a stable snapshot.' }],
              },
            ]),
            content_format: 'blocknote_json',
          },
        ],
      }
    }
    if (text.includes('select latest_indexed_version')) return { rows: [] }

    return { rows: [] }
  }

  const pool = {
    query,
    async connect() {
      return { query, release() {} }
    },
  } as unknown as Pool
  const ai = {
    async embedMany() {
      return { embeddings: [[1, 2]] }
    },
  } as unknown as AiRuntime
  const qdrant = {
    async getCollection() {
      return { config: { params: { vectors: { size: 2 } } } }
    },
    async upsert(_collection: string, input: { points: Array<{ payload: Record<string, unknown> }> }) {
      capturedPayloads = input.points.map((point) => point.payload)
    },
    async delete(_collection: string, input: unknown) {
      deleteRequest = input
    },
  } as unknown as QdrantClient
  const config = {
    workerJobLeaseMs: 1_000,
    embeddingDimensions: 2,
    embeddingModel: 'text-embedding-v1',
    qdrantCollection: 'document_snapshots',
  } as WorkerConfig

  await runDocumentIndexJobs({ config, pool, ai, qdrant })

  const snapshotQuery = queries.find(({ text }) => text.includes('from document_snapshots as snapshots'))
  assert.ok(snapshotQuery)
  assert.match(snapshotQuery.text, /join documents on documents\.id = snapshots\.document_id/)
  assert.match(snapshotQuery.text, /join spaces on spaces\.id = documents\.space_id/)
  assert.match(snapshotQuery.text, /spaces\.id as workspace_id/)
  assert.match(snapshotQuery.text, /documents\.space_id/)
  assert.deepEqual(snapshotQuery.values, ['doc-1', 4])
  assert.deepEqual(capturedPayloads, [
    {
      workspaceId: 'workspace-1',
      spaceId: 'space-1',
      documentId: 'doc-1',
      snapshotVersion: 4,
      blockId: 'block-1',
      chunkId: 'block-1:0',
      headingPath: [],
      plainText: 'Indexed from a stable snapshot.',
    },
  ])
  assert.deepEqual(deleteRequest, {
    wait: true,
    filter: {
      must: [
        { key: 'documentId', match: { value: 'doc-1' } },
        { key: 'snapshotVersion', match: { value: 4 } },
      ],
      must_not: [{ has_id: ['f723f141-c8a7-3d28-6dbb-df90bc3e9b64'] }],
    },
  })
})
