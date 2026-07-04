type SpaceRecord = {
  id: string
  name: string
  summary: string
  rootDocuments: string[]
}

type DocumentRecord = {
  id: string
  title: string
  status: 'draft' | 'review' | 'ready'
  summary: string
  spaceId: string
  updatedAt: string
}

const spaces: SpaceRecord[] = [
  {
    id: 'product',
    name: 'Product Workspace',
    summary: 'Owns workspace UX, editor surfaces, and user-facing flows.',
    rootDocuments: ['doc-editor-runtime'],
  },
  {
    id: 'architecture',
    name: 'Architecture',
    summary: 'Owns service boundaries, contracts, and implementation sequencing.',
    rootDocuments: ['doc-collab-token'],
  },
]

const documents: DocumentRecord[] = [
  {
    id: 'doc-editor-runtime',
    title: 'Editor Runtime Baseline',
    status: 'draft',
    summary: 'Seed the editor page shell, route boundaries, and workspace navigation.',
    spaceId: 'product',
    updatedAt: '2026-07-04T00:00:00.000Z',
  },
  {
    id: 'doc-collab-token',
    title: 'Collaboration Token Flow',
    status: 'review',
    summary: 'Map how api and collab exchange access tokens for Yjs sessions.',
    spaceId: 'architecture',
    updatedAt: '2026-07-03T00:00:00.000Z',
  },
]

export default class DocweaveCatalogService {
  // Keep scaffold data centralized so route handlers stay close to future production wiring.
  listSpaces() {
    return spaces
  }

  getSpaceTree(spaceId: string) {
    const space = spaces.find((entry) => entry.id === spaceId) ?? null

    if (!space) {
      return null
    }

    return {
      space,
      children: documents
        .filter((document) => document.spaceId === spaceId)
        .map((document) => ({
          id: document.id,
          title: document.title,
          kind: 'document',
          status: document.status,
        })),
    }
  }

  getDocument(documentId: string) {
    return documents.find((entry) => entry.id === documentId) ?? null
  }
}
