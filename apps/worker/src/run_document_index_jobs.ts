import { Pool, type PoolClient } from 'pg'
import { QdrantClient } from '@qdrant/js-client-rest'
import type { AiRuntime } from '@docweave/ai'
import { createModelRef } from '@docweave/adapters'
import { readSnapshotContent } from '@docweave/document'
import {
  buildBlockChunks,
  createStablePointId,
  indexDocumentSnapshot,
  type RagVectorPoint,
} from '@docweave/rag'
import type { WorkerConfig } from './config.js'

type ClaimedJob = {
  id: string
  documentId: string
  targetSnapshotVersion: number
}

type SnapshotRow = {
  document_id: string
  workspace_id: string
  space_id: string
  content: string
  content_format: 'blocknote_json'
}

export type WorkerRuntime = {
  config: WorkerConfig
  pool: Pool
  ai: AiRuntime
  qdrant: QdrantClient
}

export async function runDocumentIndexJobs(runtime: WorkerRuntime) {
  const job = await claimNextDocumentIndexJob(runtime.pool, runtime.config.workerJobLeaseMs)

  if (!job) {
    return false
  }

  try {
    const snapshot = await loadSnapshot(runtime.pool, job)

    if (!snapshot) {
      await markDocumentIndexJobFailed(
        runtime.pool,
        job.id,
        'SNAPSHOT_NOT_FOUND',
        'Snapshot not found'
      )
      return true
    }

    const parsed = readSnapshotContent({
      content: snapshot.content,
      contentFormat: snapshot.content_format,
    })
    const currentPointIds = buildBlockChunks({
      workspaceId: snapshot.workspace_id,
      spaceId: snapshot.space_id,
      documentId: job.documentId,
      snapshotVersion: job.targetSnapshotVersion,
      blocks: parsed.blocks,
    }).map(createStablePointId)

    await markDocumentIndexJobStage(runtime.pool, job.id, 'chunking')

    let embeddingStageMarked = false
    let upsertingStageMarked = false
    let publishingStageMarked = false

    const result = await indexDocumentSnapshot(
      {
        workspaceId: snapshot.workspace_id,
        spaceId: snapshot.space_id,
        documentId: job.documentId,
        snapshotVersion: job.targetSnapshotVersion,
        blocks: parsed.blocks,
      },
      {
        embeddingDimensions: runtime.config.embeddingDimensions,
        embed: async (texts) => {
          if (!embeddingStageMarked) {
            await markDocumentIndexJobStage(runtime.pool, job.id, 'embedding')
            embeddingStageMarked = true
          }

          const response = await runtime.ai.embedMany({
            model: createModelRef('embedding', runtime.config.embeddingModel),
            values: texts,
            dimensions: runtime.config.embeddingDimensions,
          })

          return response.embeddings
        },
        ensureCollectionDimensions: async (dimensions) => {
          if (!upsertingStageMarked) {
            await markDocumentIndexJobStage(runtime.pool, job.id, 'upserting')
            upsertingStageMarked = true
          }

          await ensureCollectionDimensions(
            runtime.qdrant,
            runtime.config.qdrantCollection,
            dimensions
          )
        },
        upsert: async (points) => {
          await upsertPoints(runtime.qdrant, runtime.config.qdrantCollection, points)
        },
        canPublish: async (snapshotVersion) => {
          if (!publishingStageMarked) {
            await markDocumentIndexJobStage(runtime.pool, job.id, 'publishing')
            publishingStageMarked = true
          }

          return canPublishSnapshotVersion(runtime.pool, job.documentId, snapshotVersion)
        },
      }
    )

    if (result.status === 'superseded') {
      await markDocumentIndexJobSuperseded(runtime.pool, job.id)
      return true
    }

    // 同一快照版本被重新建立索引时，旧 block 已不在当前快照中也必须被移除，
    // 否则 retrieval 仅按版本过滤仍会返回无法回跳的过期 Citation。
    await removeStaleSnapshotPoints(
      runtime.qdrant,
      runtime.config.qdrantCollection,
      job.documentId,
      job.targetSnapshotVersion,
      currentPointIds
    )
    await publishIndexedVersion(runtime.pool, job)
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown indexing error'
    await markDocumentIndexJobFailed(runtime.pool, job.id, 'INDEX_JOB_FAILED', message)
    return true
  }
}

async function claimNextDocumentIndexJob(pool: Pool, leaseMs: number) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const result = await client.query<ClaimedJob>(
      `
        select id, document_id as "documentId", target_snapshot_version as "targetSnapshotVersion"
        from rag_index_jobs
        where status = 'pending'
           or (status = 'running' and locked_at < now() - ($1 * interval '1 millisecond'))
        order by case when status = 'pending' then 0 else 1 end, created_at asc
        limit 1
        for update skip locked
      `,
      [leaseMs]
    )

    const nextJob = result.rows[0]

    if (!nextJob) {
      await client.query('ROLLBACK')
      return null
    }

    await client.query(
      `
        update rag_index_jobs
        set status = 'running',
            stage = 'preprocessing',
            locked_at = now(),
            started_at = coalesce(started_at, now()),
            attempt_count = attempt_count + 1,
            updated_at = now()
        where id = $1
      `,
      [nextJob.id]
    )

    await client.query('COMMIT')
    return nextJob
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function loadSnapshot(pool: Pool, job: ClaimedJob) {
  const result = await pool.query<SnapshotRow>(
    `
      -- 当前数据模型以 space 作为 workspace 边界；同时保留两个契约字段，为后续独立 workspace 做准备。
      select snapshots.document_id,
             spaces.id as workspace_id,
             documents.space_id,
             snapshots.content,
             snapshots.content_format
      from document_snapshots as snapshots
      join documents on documents.id = snapshots.document_id
      join spaces on spaces.id = documents.space_id
      where snapshots.document_id = $1 and snapshots.version = $2
      limit 1
    `,
    [job.documentId, job.targetSnapshotVersion]
  )

  return result.rows[0] ?? null
}

async function canPublishSnapshotVersion(pool: Pool, documentId: string, snapshotVersion: number) {
  const result = await pool.query<{ latest_indexed_version: number | null }>(
    'select latest_indexed_version from documents where id = $1 limit 1',
    [documentId]
  )

  const latestIndexedVersion = result.rows[0]?.latest_indexed_version ?? null
  return latestIndexedVersion === null || latestIndexedVersion <= snapshotVersion
}

async function publishIndexedVersion(pool: Pool, job: ClaimedJob) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const documentResult = await client.query<{ latest_indexed_version: number | null }>(
      'select latest_indexed_version from documents where id = $1 for update',
      [job.documentId]
    )

    const latestIndexedVersion = documentResult.rows[0]?.latest_indexed_version ?? null

    if (latestIndexedVersion !== null && latestIndexedVersion > job.targetSnapshotVersion) {
      await client.query(
        `
          update rag_index_jobs
          set status = 'superseded',
              finished_at = now(),
              locked_at = null,
              updated_at = now()
          where id = $1
        `,
        [job.id]
      )

      await client.query('COMMIT')
      return
    }

    await client.query('update documents set latest_indexed_version = $2 where id = $1', [
      job.documentId,
      job.targetSnapshotVersion,
    ])
    await client.query(
      `
        update rag_index_jobs
        set status = 'succeeded',
            stage = 'publishing',
            finished_at = now(),
            locked_at = null,
            updated_at = now()
        where id = $1
      `,
      [job.id]
    )

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function markDocumentIndexJobStage(
  pool: Pool,
  jobId: string,
  stage: 'chunking' | 'embedding' | 'upserting' | 'publishing'
) {
  await pool.query(
    'update rag_index_jobs set stage = $2, locked_at = now(), updated_at = now() where id = $1',
    [jobId, stage]
  )
}

async function markDocumentIndexJobFailed(
  pool: Pool,
  jobId: string,
  errorCode: string,
  errorMessage: string
) {
  await pool.query(
    `
      update rag_index_jobs
      set status = 'failed',
          error_code = $2,
          error_message = $3,
          finished_at = now(),
          locked_at = null,
          updated_at = now()
      where id = $1
    `,
    [jobId, errorCode, errorMessage.slice(0, 2000)]
  )
}

async function markDocumentIndexJobSuperseded(pool: Pool, jobId: string) {
  await pool.query(
    `
      update rag_index_jobs
      set status = 'superseded',
          finished_at = now(),
          locked_at = null,
          updated_at = now()
      where id = $1
    `,
    [jobId]
  )
}

async function ensureCollectionDimensions(
  qdrant: QdrantClient,
  collectionName: string,
  dimensions: number
) {
  try {
    const collection = await qdrant.getCollection(collectionName)
    const configuredDimensions = readCollectionVectorDimensions(collection)

    if (configuredDimensions !== dimensions) {
      throw new Error(
        `Qdrant collection dimension mismatch: expected ${dimensions}, received ${configuredDimensions}`
      )
    }
  } catch (error) {
    if (isMissingCollectionError(error)) {
      await qdrant.createCollection(collectionName, {
        vectors: {
          size: dimensions,
          distance: 'Cosine',
        },
      })
      return
    }

    throw error
  }
}

async function upsertPoints(
  qdrant: QdrantClient,
  collectionName: string,
  points: RagVectorPoint[]
) {
  if (points.length === 0) {
    return
  }

  await qdrant.upsert(collectionName, {
    points,
  })
}

async function removeStaleSnapshotPoints(
  qdrant: QdrantClient,
  collectionName: string,
  documentId: string,
  snapshotVersion: number,
  currentPointIds: string[]
) {
  await qdrant.delete(collectionName, {
    wait: true,
    filter: {
      must: [
        { key: 'documentId', match: { value: documentId } },
        { key: 'snapshotVersion', match: { value: snapshotVersion } },
      ],
      // 空快照也需要清除同版本的历史 points，避免旧 Citation 继续被检索到。
      ...(currentPointIds.length > 0 ? { must_not: [{ has_id: currentPointIds }] } : {}),
    },
  })
}

function readCollectionVectorDimensions(collection: unknown) {
  const vectors = (collection as { config?: { params?: { vectors?: unknown } } })?.config?.params
    ?.vectors

  if (typeof vectors === 'object' && vectors !== null) {
    if ('size' in vectors && typeof vectors.size === 'number') {
      return vectors.size
    }

    const firstNamedVector = Object.values(vectors)[0] as { size?: number } | undefined

    if (firstNamedVector?.size) {
      return firstNamedVector.size
    }
  }

  throw new Error('Unable to read Qdrant collection vector dimensions')
}

function isMissingCollectionError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  return /404|not found|doesn't exist/i.test(error.message)
}
