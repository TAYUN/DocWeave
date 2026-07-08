import type { PartialBlock } from '@blocknote/core'

export type DocumentContent = PartialBlock[]

export type DocumentStatus = 'draft' | 'review' | 'ready'

export type CurrentUserDto = {
  id: number
  fullName: string | null
  email: string
  createdAt: string | null
  updatedAt: string | null
  initials: string
}

export type SpaceDto = {
  id: string
  name: string
  summary: string | null
  rootDocuments: string[]
}

export type SpaceTreeDocumentDto = {
  id: string
  title: string
  kind: 'document'
  status: DocumentStatus
}

export type SpaceTreeDto = {
  space: Pick<SpaceDto, 'id' | 'name' | 'summary'>
  children: SpaceTreeDocumentDto[]
}

export type DocumentSummaryDto = {
  id: string
  title: string
  status: DocumentStatus
  summary: string | null
  spaceId: string
  updatedAt: string | null
}

export type DocumentDetailDto = DocumentSummaryDto & {
  content: string
}

export type CreateSpaceInput = {
  name: string
  summary: string
}

export type CreateDocumentInput = {
  spaceId: string
  title: string
  summary: string
}

export type UpdateDocumentInput = {
  title?: string
  summary?: string
  content?: string
}
