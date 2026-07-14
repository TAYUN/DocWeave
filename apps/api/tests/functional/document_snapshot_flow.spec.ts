import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Document from '#models/document'
import DocumentSnapshot from '#models/document_snapshot'
import RagIndexJob from '#models/rag_index_job'
import Space from '#models/space'
import SpaceMember from '#models/space_member'
import User from '#models/user'

async function login(client: Parameters<typeof test>[0] extends never ? never : any, user: User) {
  const response = await client.post('/api/auth/login').json({
    email: user.email,
    password: 'docweave123',
  })

  response.assertStatus(200)
  return response.body().data.token as string
}

test.group('document snapshot flow', () => {
  test('creates the first snapshot and reuses it when content has not changed', async ({
    client,
    assert,
  }) => {
    await RagIndexJob.query().delete()
    await DocumentSnapshot.query().delete()
    await Document.query().delete()
    await SpaceMember.query().delete()
    await Space.query().delete()
    await User.query().delete()

    const user = await User.create({
      email: 'snapshot-owner@docweave.dev',
      fullName: 'Snapshot Owner',
      password: 'docweave123',
    })

    const token = await login(client, user)

    const space = await Space.create({
      id: 'snapshot-space',
      name: 'Snapshot Space',
      summary: 'Snapshot baseline tests.',
    })
    await SpaceMember.create({ spaceId: space.id, userId: user.id, role: 'owner' })

    const document = await Document.create({
      id: 'snapshot-doc',
      spaceId: space.id,
      title: 'Snapshot Doc',
      summary: 'Snapshot summary',
      content: '[{"type":"paragraph","content":"v1"}]',
      status: 'draft',
    })

    const firstResponse = await client
      .post(`/api/documents/${document.id}/snapshots`)
      .header('authorization', `Bearer ${token}`)

    firstResponse.assertStatus(200)
    firstResponse.assertBodyContains({
      data: {
        latestSnapshotVersion: 1,
        snapshot: {
          documentId: document.id,
          version: 1,
          contentFormat: 'blocknote_json',
        },
      },
    })

    const secondResponse = await client
      .post(`/api/documents/${document.id}/snapshots`)
      .header('authorization', `Bearer ${token}`)

    secondResponse.assertStatus(200)
    secondResponse.assertBodyContains({
      data: {
        latestSnapshotVersion: 1,
        snapshot: {
          documentId: document.id,
          version: 1,
        },
      },
    })

    const snapshots = await DocumentSnapshot.query()
      .where('document_id', document.id)
      .orderBy('version', 'asc')
    assert.lengthOf(snapshots, 1)

    await document
      .merge({
        content: '[{"type":"paragraph","content":"v2"}]',
        updatedAt: DateTime.utc().plus({ minute: 1 }),
      })
      .save()

    const thirdResponse = await client
      .post(`/api/documents/${document.id}/snapshots`)
      .header('authorization', `Bearer ${token}`)

    thirdResponse.assertStatus(200)
    thirdResponse.assertBodyContains({
      data: {
        latestSnapshotVersion: 2,
        snapshot: {
          documentId: document.id,
          version: 2,
        },
      },
    })

    const refreshedDocument = await Document.findOrFail(document.id)
    const finalSnapshots = await DocumentSnapshot.query().where('document_id', document.id)
    assert.equal(refreshedDocument.latestSnapshotVersion, 2)
    assert.lengthOf(finalSnapshots, 2)
  })
})
