import type { DocumentStatus } from './document.js'

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

export type CreateSpaceInput = {
  name: string
  summary: string
}
