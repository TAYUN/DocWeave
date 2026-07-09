import type { PartialBlock } from '@blocknote/core'

export type DocumentContent = PartialBlock[]

export type DocumentStatus = 'draft' | 'review' | 'ready'

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
