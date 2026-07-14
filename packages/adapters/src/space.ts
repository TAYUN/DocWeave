import type { SpaceDto, SpaceTreeDocumentDto, SpaceTreeDto } from '@docweave/contracts/space'
import type { DocumentStatus } from '@docweave/contracts/document'

export type SpaceDocumentSource = {
  id: string
  title?: string
  status?: DocumentStatus | string
}

export type SpaceSource = {
  id: string
  name: string
  summary: string | null
  documents?: SpaceDocumentSource[]
}

function normalizeDocumentStatus(status: DocumentStatus | string | undefined): DocumentStatus {
  switch (status) {
    case 'draft':
    case 'review':
    case 'ready':
      return status
    default:
      return 'draft'
  }
}

function toSpaceTreeDocumentDto(document: SpaceDocumentSource): SpaceTreeDocumentDto {
  return {
    id: document.id,
    title: document.title ?? '未命名文档',
    kind: 'document',
    status: normalizeDocumentStatus(document.status),
  }
}

export function toSpaceDto(space: SpaceSource): SpaceDto {
  return {
    id: space.id,
    name: space.name,
    summary: space.summary,
    rootDocuments: (space.documents ?? []).map((document) => document.id),
  }
}

export function toSpaceTreeDto(space: SpaceSource): SpaceTreeDto {
  return {
    space: {
      id: space.id,
      name: space.name,
      summary: space.summary,
    },
    children: (space.documents ?? []).map(toSpaceTreeDocumentDto),
  }
}
