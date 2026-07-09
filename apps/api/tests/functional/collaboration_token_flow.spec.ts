import { test } from '@japa/runner'
import User from '#models/user'
import Space from '#models/space'
import Document from '#models/document'
import {
  buildDocumentRoomName,
  type CollaborationTokenPayload,
} from '@docweave/contracts/collaboration'
import { verifyCollaborationToken } from '#services/collaboration_token_service'

test.group('collaboration token flow', () => {
  test('rejects anonymous callers and returns a verifiable room-scoped token for authenticated users', async ({
    client,
    assert,
  }) => {
    await Document.query().delete()
    await Space.query().delete()
    await User.query().delete()

    const user = await User.create({
      email: 'collab-owner@docweave.dev',
      fullName: 'Collab Owner',
      password: 'docweave123',
    })

    const space = await Space.create({
      id: 'product',
      name: 'Product Workspace',
      summary: 'Owns collaboration work.',
    })

    const document = await Document.create({
      id: 'editor-baseline',
      spaceId: space.id,
      title: 'Editor Baseline',
      summary: 'Collaboration baseline',
      content: '[]',
      status: 'draft',
    })

    const anonymousResponse = await client.post('/api/collaboration/token').json({
      documentId: document.id,
    })

    anonymousResponse.assertStatus(401)

    const loginResponse = await client.post('/api/auth/login').json({
      email: user.email,
      password: 'docweave123',
    })

    loginResponse.assertStatus(200)

    const token = loginResponse.body().data.token as string

    const collabResponse = await client
      .post('/api/collaboration/token')
      .header('authorization', `Bearer ${token}`)
      .json({
        documentId: document.id,
      })

    collabResponse.assertStatus(200)

    const body = (collabResponse.body() as {
      data: {
        documentId: string
        roomName: string
        token: string
        provider: string
        expiresInSeconds: number
      }
    }).data

    assert.equal(body.documentId, document.id)
    assert.equal(body.roomName, buildDocumentRoomName(space.id, document.id))
    assert.equal(body.provider, 'apps/collab')
    assert.isAbove(body.expiresInSeconds, 0)
    assert.notEqual(body.token, 'collab-scaffold-token')

    const payload = verifyCollaborationToken(
      body.token,
      process.env.COLLAB_SECRET!,
    ) as CollaborationTokenPayload

    assert.equal(payload.version, 'v1')
    assert.equal(payload.workspaceId, space.id)
    assert.equal(payload.documentId, document.id)
    assert.equal(payload.roomName, body.roomName)
    assert.deepEqual(payload.capabilities, {
      canRead: true,
      canEdit: true,
    })
    assert.equal(payload.user.id, user.id)
    assert.equal(payload.user.email, user.email)
    assert.equal(payload.user.fullName, user.fullName)
    assert.isString(payload.user.initials)
    assert.isAbove(payload.expiresAt, payload.issuedAt)
  })
})
