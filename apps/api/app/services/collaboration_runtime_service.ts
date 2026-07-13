import type {
  CollaborationRuntimeDocumentDto,
  UpdateCollaborationRuntimeInput,
} from '@docweave/contracts/collaboration'
import Document from '#models/document'

function toIsoString(value: { toISO(): string | null } | string | null | undefined) {
  if (!value) return null
  if (typeof value === 'string') return value
  return value.toISO()
}

function toRuntimeDto(
  document: Pick<Document, 'id' | 'content' | 'updatedAt'>
): CollaborationRuntimeDocumentDto {
  return {
    documentId: document.id,
    content: document.content,
    updatedAt: toIsoString(document.updatedAt),
  }
}

export default class CollaborationRuntimeService {
  async getRuntimeDocument(documentId: string): Promise<CollaborationRuntimeDocumentDto | null> {
    const document = await Document.find(documentId)

    if (!document) {
      return null
    }

    return toRuntimeDto(document)
  }

  async updateRuntimeDocument(
    documentId: string,
    input: UpdateCollaborationRuntimeInput
  ): Promise<CollaborationRuntimeDocumentDto | null> {
    const document = await Document.find(documentId)

    if (!document) {
      return null
    }

    document.content = input.content
    await document.save()

    return toRuntimeDto(document)
  }
}
