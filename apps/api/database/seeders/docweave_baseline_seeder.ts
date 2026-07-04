import Document from '#models/document'
import Space from '#models/space'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    await Space.updateOrCreate(
      { id: 'product' },
      {
        name: 'Product Workspace',
        summary: 'Owns workspace UX, editor surfaces, and user-facing flows.',
      },
    )

    await Space.updateOrCreate(
      { id: 'architecture' },
      {
        name: 'Architecture',
        summary: 'Owns service boundaries, contracts, and implementation sequencing.',
      },
    )

    await Document.updateOrCreate(
      { id: 'doc-editor-runtime' },
      {
        spaceId: 'product',
        title: 'Editor Runtime Baseline',
        summary: 'Seed the editor page shell, route boundaries, and workspace navigation.',
        status: 'draft',
      },
    )

    await Document.updateOrCreate(
      { id: 'doc-collab-token' },
      {
        spaceId: 'architecture',
        title: 'Collaboration Token Flow',
        summary: 'Map how api and collab exchange access tokens for Yjs sessions.',
        status: 'review',
      },
    )

    await Document.updateOrCreate(
      { id: 'doc-rag-pipeline' },
      {
        spaceId: 'architecture',
        title: 'RAG Snapshot Pipeline',
        summary: 'Track snapshot, chunking, embedding, and Qdrant indexing milestones.',
        status: 'ready',
      },
    )
  }
}
