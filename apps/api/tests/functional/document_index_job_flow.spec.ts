import { test } from '@japa/runner'
import Document from '#models/document'
import DocumentSnapshot from '#models/document_snapshot'
import RagIndexJob from '#models/rag_index_job'
import Space from '#models/space'
import User from '#models/user'

async function login(client: Parameters<typeof test>[0] extends never ? never : any, user: User) {
  const response = await client.post('/api/auth/login').json({
    email: user.email,
    password: 'docweave123',
  })

  response.assertStatus(200)
  return response.body().data.token as string
}

test.group('document index job flow', () => {
  test('creates, reuses, and supersedes jobs while exposing status summary', async ({
    client,
    assert,
  }) => {
    await RagIndexJob.query().delete()
    await DocumentSnapshot.query().delete()
    await Document.query().delete()
    await Space.query().delete()
    await User.query().delete()

    const user = await User.create({
      email: 'index-owner@docweave.dev',
      fullName: 'Index Owner',
      password: 'docweave123',
    })

    const token = await login(client, user)

    const space = await Space.create({
      id: 'index-space',
      name: 'Index Space',
      summary: 'Index baseline tests.',
    })

    const document = await Document.create({
      id: 'index-doc',
      spaceId: space.id,
      title: 'Index Doc',
      summary: 'Index summary',
      content: '[{"type":"paragraph","content":"v2"}]',
      status: 'draft',
      latestSnapshotVersion: 2,
    })

    await DocumentSnapshot.create({
      id: 'snapshot-1',
      documentId: document.id,
      version: 1,
      content: '[{"type":"paragraph","content":"v1"}]',
      contentFormat: 'blocknote_json',
    })
    await DocumentSnapshot.create({
      id: 'snapshot-2',
      documentId: document.id,
      version: 2,
      content: '[{"type":"paragraph","content":"v2"}]',
      contentFormat: 'blocknote_json',
    })

    const olderVersionResponse = await client
      .post(`/api/documents/${document.id}/index`)
      .header('authorization', `Bearer ${token}`)
      .json({
        snapshotVersion: 1,
      })

    olderVersionResponse.assertStatus(200)
    const olderJobId = olderVersionResponse.body().data.job.id as string

    const duplicateJobResponse = await client
      .post(`/api/documents/${document.id}/index`)
      .header('authorization', `Bearer ${token}`)
      .json({
        snapshotVersion: 1,
      })

    duplicateJobResponse.assertStatus(200)
    assert.equal(duplicateJobResponse.body().data.job.id, olderJobId)
    assert.lengthOf(await RagIndexJob.query().where('document_id', document.id), 1)

    const newerVersionResponse = await client
      .post(`/api/documents/${document.id}/index`)
      .header('authorization', `Bearer ${token}`)
      .json({
        snapshotVersion: 2,
      })

    newerVersionResponse.assertStatus(200)

    const oldJob = await RagIndexJob.findOrFail(olderJobId)
    assert.equal(oldJob.status, 'superseded')

    const activeJobs = await RagIndexJob.query()
      .where('document_id', document.id)
      .andWhere('target_snapshot_version', 2)
      .whereIn('status', ['pending', 'running'])
    assert.lengthOf(activeJobs, 1)

    const missingSnapshotResponse = await client
      .post(`/api/documents/${document.id}/index`)
      .header('authorization', `Bearer ${token}`)
      .json({
        snapshotVersion: 99,
      })

    missingSnapshotResponse.assertStatus(404)

    const statusResponse = await client
      .get(`/api/documents/${document.id}/status`)
      .header('authorization', `Bearer ${token}`)

    statusResponse.assertStatus(200)
    statusResponse.assertBodyContains({
      data: {
        documentId: document.id,
        latestSnapshotVersion: 2,
        latestIndexedVersion: null,
        latestSnapshot: {
          documentId: document.id,
          version: 2,
          contentFormat: 'blocknote_json',
        },
        latestIndexJob: {
          id: newerVersionResponse.body().data.job.id,
          targetSnapshotVersion: 2,
          status: 'pending',
          stage: 'queued',
        },
      },
    })
  })
})
