import type { RagAuthorizedDocument } from '@docweave/contracts/rag'
import Document from '#models/document'
import SpaceMember from '#models/space_member'

/**
 * Read-only membership boundary consumed by RAG and future space-scoped use cases.
 */
export default class SpaceMembershipService {
  async hasSpaceAccess(userId: number, spaceId: string): Promise<boolean> {
    const membership = await SpaceMember.query()
      .where('user_id', userId)
      .where('space_id', spaceId)
      .first()

    return membership !== null
  }

  async listVisibleDocuments(userId: number): Promise<RagAuthorizedDocument[]> {
    const documents = await Document.query()
      .join('space_members', 'documents.space_id', 'space_members.space_id')
      .where('space_members.user_id', userId)
      .select('documents.id', 'documents.space_id', 'documents.latest_indexed_version')

    return documents.map((document) => ({
      workspaceId: document.spaceId,
      spaceId: document.spaceId,
      documentId: document.id,
      latestIndexedVersion: document.latestIndexedVersion,
    }))
  }
}
