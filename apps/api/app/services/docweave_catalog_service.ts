import Document from '#models/document'
import Space from '#models/space'

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
      spaceId: document.spaceId,
      updatedAt: document.updatedAt?.toISO() ?? document.createdAt.toISO(),
    }
  }

  async updateDocument(
    documentId: string,
    patch: Partial<Pick<Document, 'title' | 'summary'>>,
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
      spaceId: document.spaceId,
      updatedAt: document.updatedAt?.toISO() ?? document.createdAt.toISO(),
    }
  }
}
