import { test } from '@japa/runner'
import env from '#start/env'
import Document from '#models/document'
import DocumentSnapshot from '#models/document_snapshot'
import RagIndexJob from '#models/rag_index_job'
import Space from '#models/space'
import { apiErrors } from '#exceptions/error_messages'

const internalSecret = env.get('COLLAB_SECRET').release()

test.group('collaboration runtime flow', (group) => {
  group.each.setup(async () => {
    await RagIndexJob.query().delete()
    await DocumentSnapshot.query().delete()
    await Document.query().delete()
    await Space.query().delete()
  })

  test('reads and updates runtime content without creating snapshot side effects', async ({
    client,
    assert,
  }) => {
    const space = await Space.create({
      id: 'collab-runtime-space',
      name: 'Collab Runtime Space',
      summary: 'Collaboration runtime tests.',
    })

    const document = await Document.create({
      id: 'collab-runtime-doc',
      spaceId: space.id,
      title: 'Collab Runtime Doc',
      summary: 'Runtime summary',
      content: '[{"id":"a","type":"paragraph","content":"v1"}]',
      status: 'draft',
      latestSnapshotVersion: 1,
    })

    await DocumentSnapshot.create({
      id: 'snapshot-1',
      documentId: document.id,
      version: 1,
      content: document.content,
      contentFormat: 'blocknote_json',
      sourceDocumentUpdatedAt: document.updatedAt,
    })

    const showResponse = await client
      .get(`/api/internal/collaboration/documents/${document.id}/runtime`)
      .header('x-collaboration-secret', internalSecret)

    showResponse.assertStatus(200)
    showResponse.assertBodyContains({
      data: {
        documentId: document.id,
        content: document.content,
      },
    })

    const updateResponse = await client
      .put(`/api/internal/collaboration/documents/${document.id}/runtime`)
      .header('x-collaboration-secret', internalSecret)
      .json({
        content: '[{"id":"b","type":"paragraph","content":"v2"}]',
      })

    updateResponse.assertStatus(200)
    updateResponse.assertBodyContains({
      data: {
        documentId: document.id,
        content: '[{"id":"b","type":"paragraph","content":"v2"}]',
      },
    })

    const refreshedDocument = await Document.findOrFail(document.id)
    const snapshots = await DocumentSnapshot.query().where('document_id', document.id)
    const jobs = await RagIndexJob.query().where('document_id', document.id)

    assert.equal(refreshedDocument.content, '[{"id":"b","type":"paragraph","content":"v2"}]')
    assert.equal(refreshedDocument.latestSnapshotVersion, 1)
    assert.lengthOf(snapshots, 1)
    assert.lengthOf(jobs, 0)
  })

  test('rejects runtime calls without the collaboration secret', async ({ client }) => {
    const response = await client.get('/api/internal/collaboration/documents/missing/runtime')

    response.assertStatus(401)
    response.assertBodyContains({
      code: apiErrors.unauthorizedCollaborationRuntimeRequest.code,
      message: apiErrors.unauthorizedCollaborationRuntimeRequest.message,
    })
  })
})
