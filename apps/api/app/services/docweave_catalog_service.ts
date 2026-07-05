import { randomUUID } from 'node:crypto'
import Document from '#models/document'
import Space from '#models/space'

type SpaceInput = {
  name: string
  summary: string
}

type DocumentInput = {
  spaceId: string
  title: string
  summary: string
}

const DEFAULT_DOCUMENT_CONTENT = JSON.stringify([
  {
    type: 'paragraph',
    content: 'Start writing your document here.',
  },
])

export default class DocweaveCatalogService {
  // Keep persistence access centralized so controllers stay focused on API semantics.
  async listSpaces() {
    const spaces = await Space.query().preload('documents')

    return spaces.map((space) => ({
      id: space.id,
      name: space.name,
      summary: space.summary,
      rootDocuments: space.documents.map((document) => document.id),
    }))
  }

  async listDocuments() {
    const documents = await Document.query().orderBy('updated_at', 'desc')

    return documents.map((document) => ({
      id: document.id,
      title: document.title,
      status: document.status,
      summary: document.summary,
      content: document.content,
      spaceId: document.spaceId,
      updatedAt: document.updatedAt?.toISO() ?? document.createdAt.toISO(),
    }))
  }

  async getSpaceTree(spaceId: string) {
    const space = await Space.query().where('id', spaceId).preload('documents').first()

    if (!space) {
      return null
    }

    return {
      space: {
        id: space.id,
        name: space.name,
        summary: space.summary,
      },
      children: space.documents.map((document) => ({
        id: document.id,
        title: document.title,
        kind: 'document',
        status: document.status,
      })),
    }
  }

  async getDocument(documentId: string) {
    const document = await Document.find(documentId)

    if (!document) {
      return null
    }

    return {
      id: document.id,
      title: document.title,
      status: document.status,
      summary: document.summary,
      content: document.content,
      spaceId: document.spaceId,
      updatedAt: document.updatedAt?.toISO() ?? document.createdAt.toISO(),
    }
  }

  async updateDocument(
    documentId: string,
    patch: Partial<Pick<Document, 'title' | 'summary' | 'content'>>,
  ) {
    const document = await Document.find(documentId)

    if (!document) {
      return null
    }

    document.merge(patch)
    await document.save()

    return {
      id: document.id,
      title: document.title,
      status: document.status,
      summary: document.summary,
      content: document.content,
      spaceId: document.spaceId,
      updatedAt: document.updatedAt?.toISO() ?? document.createdAt.toISO(),
    }
  }

  async createSpace(input: SpaceInput) {
    const space = await Space.create({
      id: this.toId(input.name),
      name: input.name,
      summary: input.summary,
    })

    return {
      id: space.id,
      name: space.name,
      summary: space.summary,
      rootDocuments: [],
    }
  }

  async createDocument(input: DocumentInput) {
    const space = await Space.find(input.spaceId)

    if (!space) {
      return null
    }

    const document = await Document.create({
      id: this.toId(input.title),
      spaceId: input.spaceId,
      title: input.title,
      summary: input.summary,
      content: DEFAULT_DOCUMENT_CONTENT,
      status: 'draft',
    })

    return {
      id: document.id,
      title: document.title,
      status: document.status,
      summary: document.summary,
      content: document.content,
      spaceId: document.spaceId,
      updatedAt: document.updatedAt?.toISO() ?? document.createdAt.toISO(),
    }
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
