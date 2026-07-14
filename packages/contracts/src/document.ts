import type { PartialBlock } from '@blocknote/core'

export type DocumentContent = PartialBlock[]

export type DocumentStatus = 'draft' | 'review' | 'ready'
export type DocumentSnapshotContentFormat = 'blocknote_json'
export type DocumentIndexJobStatus =
  'pending' | 'running' | 'succeeded' | 'failed' | 'superseded' | 'canceled'
export type DocumentIndexJobStage =
  'queued' | 'preprocessing' | 'chunking' | 'embedding' | 'upserting' | 'publishing'

export type DocumentSummaryDto = {
  id: string
  title: string
  status: DocumentStatus
  summary: string | null
  spaceId: string
  latestSnapshotVersion: number | null
  latestIndexedVersion: number | null
  updatedAt: string | null
}

export type DocumentDetailDto = DocumentSummaryDto & {
  content: string
}

export type CreateDocumentInput = {
  spaceId: string
  title: string
  summary?: string
}

export type UpdateDocumentInput = {
  title?: string
  summary?: string
  content?: string
}

export type DocumentSnapshotDto = {
  id: string
  documentId: string
  version: number
  content: string
  contentFormat: DocumentSnapshotContentFormat
  sourceDocumentUpdatedAt: string | null
  createdAt: string | null
}

export type DocumentSnapshotSummaryDto = Pick<
  DocumentSnapshotDto,
  'documentId' | 'version' | 'contentFormat' | 'createdAt'
>

export type CreateDocumentSnapshotResultDto = {
  snapshot: DocumentSnapshotDto
  latestSnapshotVersion: number
}

export type CreateDocumentIndexJobInput = {
  snapshotVersion?: number
}

export type DocumentIndexJobDto = {
  id: string
  documentId: string
  targetSnapshotVersion: number
  status: DocumentIndexJobStatus
  stage: DocumentIndexJobStage
  requestedByUserId: number | null
  attemptCount: number
  errorCode: string | null
  errorMessage: string | null
  createdAt: string | null
  startedAt: string | null
  finishedAt: string | null
}

export type CreateDocumentIndexJobResultDto = {
  job: DocumentIndexJobDto
  latestSnapshotVersion: number | null
  latestIndexedVersion: number | null
}

export type DocumentProcessingStatusDto = {
  documentId: string
  latestSnapshotVersion: number | null
  latestIndexedVersion: number | null
  latestSnapshot: DocumentSnapshotSummaryDto | null
  latestIndexJob: DocumentIndexJobDto | null
}
