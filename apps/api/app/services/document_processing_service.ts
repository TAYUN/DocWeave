import { randomUUID } from 'node:crypto'
import type {
  CreateDocumentIndexJobInput,
  CreateDocumentIndexJobResultDto,
  CreateDocumentSnapshotResultDto,
  DocumentIndexJobDto,
  DocumentProcessingStatusDto,
  DocumentSnapshotDto,
  DocumentSnapshotSummaryDto,
} from '@docweave/contracts/document'
import db from '@adonisjs/lucid/services/db'
import Document from '#models/document'
import DocumentSnapshot from '#models/document_snapshot'
import RagIndexJob from '#models/rag_index_job'

export class MissingStableSnapshotError extends Error {
  constructor() {
    super('Document has no stable snapshot yet')
  }
}

export class SnapshotVersionNotFoundError extends Error {
  constructor() {
    super('Snapshot not found')
  }
}

function toIsoString(value: { toISO(): string | null } | string | null | undefined) {
  if (!value) return null
  if (typeof value === 'string') return value
  return value.toISO()
}

function toSnapshotDto(snapshot: DocumentSnapshot): DocumentSnapshotDto {
  return {
    id: snapshot.id,
    documentId: snapshot.documentId,
    version: snapshot.version,
    content: snapshot.content,
    contentFormat: snapshot.contentFormat,
    sourceDocumentUpdatedAt: toIsoString(snapshot.sourceDocumentUpdatedAt),
    createdAt: toIsoString(snapshot.createdAt),
  }
}

function toSnapshotSummaryDto(snapshot: DocumentSnapshot): DocumentSnapshotSummaryDto {
  return {
    documentId: snapshot.documentId,
    version: snapshot.version,
    contentFormat: snapshot.contentFormat,
    createdAt: toIsoString(snapshot.createdAt),
  }
}

function toIndexJobDto(job: RagIndexJob): DocumentIndexJobDto {
  return {
    id: job.id,
    documentId: job.documentId,
    targetSnapshotVersion: job.targetSnapshotVersion,
    status: job.status,
    stage: job.stage,
    requestedByUserId: job.requestedByUserId,
    attemptCount: job.attemptCount,
    errorCode: job.errorCode,
    errorMessage: job.errorMessage,
    createdAt: toIsoString(job.createdAt),
    startedAt: toIsoString(job.startedAt),
    finishedAt: toIsoString(job.finishedAt),
  }
}

export default class DocumentProcessingService {
  async createSnapshot(documentId: string): Promise<CreateDocumentSnapshotResultDto | null> {
    return db.transaction(async (trx) => {
      const document = await Document.query({ client: trx }).where('id', documentId).forUpdate().first()

      if (!document) {
        return null
      }

      const latestSnapshot =
        document.latestSnapshotVersion === null
          ? null
          : await DocumentSnapshot.query({ client: trx })
              .where('document_id', document.id)
              .andWhere('version', document.latestSnapshotVersion)
              .first()

      const documentUpdatedAt = toIsoString(document.updatedAt)
      const latestSourceUpdatedAt = latestSnapshot
        ? toIsoString(latestSnapshot.sourceDocumentUpdatedAt)
        : null

      // M4 先用持久化正文和更新时间判断是否需要新版本，避免引入额外哈希字段。
      if (
        latestSnapshot &&
        latestSnapshot.content === document.content &&
        latestSourceUpdatedAt === documentUpdatedAt
      ) {
        return {
          snapshot: toSnapshotDto(latestSnapshot),
          latestSnapshotVersion: latestSnapshot.version,
        }
      }

      const snapshot = await DocumentSnapshot.create(
        {
          id: randomUUID(),
          documentId: document.id,
          version: (document.latestSnapshotVersion ?? 0) + 1,
          content: document.content,
          contentFormat: 'blocknote_json',
          sourceDocumentUpdatedAt: document.updatedAt,
        },
        { client: trx },
      )

      await Document.query({ client: trx }).where('id', document.id).update({
        latestSnapshotVersion: snapshot.version,
      })
      document.latestSnapshotVersion = snapshot.version

      return {
        snapshot: toSnapshotDto(snapshot),
        latestSnapshotVersion: snapshot.version,
      }
    })
  }

  async triggerIndex(
    documentId: string,
    requestedByUserId: number | null,
    input: CreateDocumentIndexJobInput,
  ): Promise<CreateDocumentIndexJobResultDto | null> {
    return db.transaction(async (trx) => {
      const document = await Document.query({ client: trx }).where('id', documentId).forUpdate().first()

      if (!document) {
        return null
      }

      const targetSnapshotVersion = input.snapshotVersion ?? document.latestSnapshotVersion

      if (targetSnapshotVersion === null) {
        throw new MissingStableSnapshotError()
      }

      const snapshot = await DocumentSnapshot.query({ client: trx })
        .where('document_id', document.id)
        .andWhere('version', targetSnapshotVersion)
        .first()

      if (!snapshot) {
        throw new SnapshotVersionNotFoundError()
      }

      const existingJob = await RagIndexJob.query({ client: trx })
        .where('document_id', document.id)
        .andWhere('target_snapshot_version', targetSnapshotVersion)
        .whereIn('status', ['pending', 'running'])
        .orderBy('created_at', 'desc')
        .first()

      if (existingJob) {
        return {
          job: toIndexJobDto(existingJob),
          latestSnapshotVersion: document.latestSnapshotVersion,
          latestIndexedVersion: document.latestIndexedVersion,
        }
      }

      await RagIndexJob.query({ client: trx })
        .where('document_id', document.id)
        .where('target_snapshot_version', '<', targetSnapshotVersion)
        .andWhere('status', 'pending')
        .update({
          status: 'superseded',
          updatedAt: db.rawQuery('CURRENT_TIMESTAMP'),
        })

      const job = await RagIndexJob.create(
        {
          id: randomUUID(),
          documentId: document.id,
          targetSnapshotVersion,
          status: 'pending',
          stage: 'queued',
          requestedByUserId,
          attemptCount: 0,
        },
        { client: trx },
      )

      return {
        job: toIndexJobDto(job),
        latestSnapshotVersion: document.latestSnapshotVersion,
        latestIndexedVersion: document.latestIndexedVersion,
      }
    })
  }

  async getStatus(documentId: string): Promise<DocumentProcessingStatusDto | null> {
    const document = await Document.find(documentId)

    if (!document) {
      return null
    }

    const latestSnapshot =
      document.latestSnapshotVersion === null
        ? null
        : await DocumentSnapshot.query()
            .where('document_id', document.id)
            .andWhere('version', document.latestSnapshotVersion)
            .first()

    const latestActiveJob = await RagIndexJob.query()
      .where('document_id', document.id)
      .whereIn('status', ['pending', 'running'])
      .orderBy('created_at', 'desc')
      .first()

    const latestCompletedJob =
      latestActiveJob ??
      (await RagIndexJob.query()
        .where('document_id', document.id)
        .whereIn('status', ['failed', 'succeeded'])
        .orderBy('created_at', 'desc')
        .first())

    return {
      documentId: document.id,
      latestSnapshotVersion: document.latestSnapshotVersion,
      latestIndexedVersion: document.latestIndexedVersion,
      latestSnapshot: latestSnapshot ? toSnapshotSummaryDto(latestSnapshot) : null,
      latestIndexJob: latestCompletedJob ? toIndexJobDto(latestCompletedJob) : null,
    }
  }
}
