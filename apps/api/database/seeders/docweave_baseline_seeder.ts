import Document from '#models/document'
import Space from '#models/space'
import SpaceMember from '#models/space_member'
import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    // 为 M2 闭环提供稳定的开发态入口，避免登录页只能接到空数据库。
    const users = await User.updateOrCreateMany('email', [
      {
        email: 'owner@docweave.dev',
        fullName: 'DocWeave Owner',
        password: 'docweave123',
      },
      {
        email: 'editor@docweave.dev',
        fullName: 'DocWeave Editor',
        password: 'docweave123',
      },
    ])
    const owner = users.find((user) => user.email === 'owner@docweave.dev')!
    const editor = users.find((user) => user.email === 'editor@docweave.dev')!

    await Space.updateOrCreate(
      { id: 'product' },
      {
        name: 'Product Workspace',
        summary: 'Owns workspace UX, editor surfaces, and user-facing flows.',
      }
    )

    await Space.updateOrCreate(
      { id: 'architecture' },
      {
        name: 'Architecture',
        summary: 'Owns service boundaries, contracts, and implementation sequencing.',
      }
    )

    // M6 以 space_members 作为唯一权限真相；两个空间创建后再构造 owner 与 viewer 场景。
    await SpaceMember.updateOrCreate({ spaceId: 'product', userId: owner.id }, { role: 'owner' })
    await SpaceMember.updateOrCreate(
      { spaceId: 'architecture', userId: owner.id },
      { role: 'owner' }
    )
    await SpaceMember.updateOrCreate({ spaceId: 'product', userId: editor.id }, { role: 'viewer' })

    await Document.updateOrCreate(
      { id: 'doc-editor-runtime' },
      {
        spaceId: 'product',
        title: 'Editor Runtime Baseline',
        summary: 'Seed the editor page shell, route boundaries, and workspace navigation.',
        status: 'draft',
      }
    )

    await Document.updateOrCreate(
      { id: 'doc-collab-token' },
      {
        spaceId: 'architecture',
        title: 'Collaboration Token Flow',
        summary: 'Map how api and collab exchange access tokens for Yjs sessions.',
        status: 'review',
      }
    )

    await Document.updateOrCreate(
      { id: 'doc-rag-pipeline' },
      {
        spaceId: 'architecture',
        title: 'RAG Snapshot Pipeline',
        summary: 'Track snapshot, chunking, embedding, and Qdrant indexing milestones.',
        status: 'ready',
      }
    )
  }
}
