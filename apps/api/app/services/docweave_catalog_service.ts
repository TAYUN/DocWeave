import { randomUUID } from 'node:crypto'
import type {
  CreateDocumentInput,
  DocumentDetailDto,
  DocumentSummaryDto,
  UpdateDocumentInput,
} from '@docweave/contracts/document'
import type {
  CreateSpaceInput,
  SpaceDto,
  SpaceTreeDto,
} from '@docweave/contracts/space'
import {
  createDefaultDocumentContent,
  serializeDocumentContent,
  toDocumentDetailDto,
  toDocumentSummaryDto,
  toSpaceDto,
  toSpaceTreeDto,
} from '@docweave/adapters'
import Document from '#models/document'
import Space from '#models/space'

export default class DocweaveCatalogService {
  // 统一把持久化访问收口在 service，controller 只表达接口语义；DTO 转换则继续下沉到 adapter。
  async listSpaces(): Promise<SpaceDto[]> {
    const spaces = await Space.query().preload('documents')

    return spaces.map((space) => toSpaceDto(space))
  }

  async listDocuments(): Promise<DocumentSummaryDto[]> {
    const documents = await Document.query().orderBy('updated_at', 'desc')

    return documents.map((document) => toDocumentSummaryDto(document))
  }

  async getSpaceTree(spaceId: string): Promise<SpaceTreeDto | null> {
    const space = await Space.query().where('id', spaceId).preload('documents').first()

    if (!space) {
      return null
    }

    return toSpaceTreeDto(space)
  }

  async getDocument(documentId: string): Promise<DocumentDetailDto | null> {
    const document = await Document.find(documentId)

    if (!document) {
      return null
    }

    return toDocumentDetailDto(document)
  }

  async updateDocument(
    documentId: string,
    patch: UpdateDocumentInput,
  ): Promise<DocumentDetailDto | null> {
    const document = await Document.find(documentId)

    if (!document) {
      return null
    }

    document.merge(patch)
    await document.save()

    return toDocumentDetailDto(document)
  }

  async createSpace(input: CreateSpaceInput): Promise<SpaceDto> {
    const space = await Space.create({
      id: this.toId(input.name),
      name: input.name,
      summary: input.summary,
    })

    return toSpaceDto(space)
  }

  async createDocument(input: CreateDocumentInput): Promise<DocumentDetailDto | null> {
    const space = await Space.find(input.spaceId)

    if (!space) {
      return null
    }

    const document = await Document.create({
      id: this.toId(input.title),
      spaceId: input.spaceId,
      title: input.title,
      summary: input.summary ?? '',
      content: serializeDocumentContent(createDefaultDocumentContent()),
      status: 'draft',
    })

    return toDocumentDetailDto(document)
  }

  private toId(value: string) {
    const base = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    return `${base || 'item'}-${randomUUID().slice(0, 8)}`
  }
}
