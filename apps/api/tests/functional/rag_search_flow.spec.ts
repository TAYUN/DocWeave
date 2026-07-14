import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import type { ApiErrorResponse, ApiSuccessResponse } from '@docweave/contracts/api'
import type { RagSearchResponse } from '@docweave/contracts/rag'
import Document from '#models/document'
import Space from '#models/space'
import SpaceMember from '#models/space_member'
import User from '#models/user'
import { apiErrors } from '#exceptions/error_messages'
import RagService from '#services/rag_service'
import SpaceMembershipService from '#services/space_membership_service'

test.group('RAG search flow', () => {
  test('returns the shared forbidden envelope before starting chat for an inaccessible space', async ({
    client,
    assert,
  }) => {
    const email = 'rag-chat-forbidden@docweave.dev'

    await User.query().where('email', email).delete()
    const user = await User.create({
      email,
      fullName: 'RAG Chat Forbidden User',
      password: 'docweave123',
    })
    const login = await client.post('/api/auth/login').json({
      email: user.email,
      password: 'docweave123',
    })
    const token = login.body().data.token as string

    try {
      const response = await client
        .post('/api/rag/chat')
        .header('authorization', `Bearer ${token}`)
        .header('accept', 'text/event-stream')
        .json({ message: 'architecture', spaceId: 'restricted-chat-space' })

      response.assertStatus(403)
      assert.deepEqual(response.body() as unknown as ApiErrorResponse, {
        code: apiErrors.forbidden.code,
        message: apiErrors.forbidden.message,
      })
    } finally {
      await User.query().where('email', email).delete()
    }
  })

  test('returns the shared success envelope with empty hits when no document is indexed', async ({
    client,
    assert,
  }) => {
    await Document.query().delete()
    await Space.query().delete()
    await User.query().delete()

    const user = await User.create({
      email: 'rag-search@docweave.dev',
      fullName: 'RAG Search User',
      password: 'docweave123',
    })
    const login = await client.post('/api/auth/login').json({
      email: user.email,
      password: 'docweave123',
    })
    const token = login.body().data.token as string

    const response = await client
      .post('/api/rag/search')
      .header('authorization', `Bearer ${token}`)
      .json({ searchText: 'architecture' })

    response.assertStatus(200)
    assert.deepEqual((response.body() as ApiSuccessResponse<RagSearchResponse>).data, {
      searchText: 'architecture',
      hits: [],
    })
  })

  test('returns the shared forbidden envelope for a space outside the visible scope', async ({
    client,
    assert,
  }) => {
    await Document.query().delete()
    await Space.query().delete()
    await User.query().delete()

    const user = await User.create({
      email: 'rag-search-forbidden@docweave.dev',
      fullName: 'RAG Search Forbidden User',
      password: 'docweave123',
    })
    const login = await client.post('/api/auth/login').json({
      email: user.email,
      password: 'docweave123',
    })
    const token = login.body().data.token as string

    const response = await client
      .post('/api/rag/search')
      .header('authorization', `Bearer ${token}`)
      .json({ searchText: 'architecture', spaceId: 'restricted-space' })

    response.assertStatus(403)
    assert.deepEqual(response.body() as ApiErrorResponse, {
      code: apiErrors.forbidden.code,
      message: apiErrors.forbidden.message,
    })
  })

  test('blocks an editor from an existing private space before embedding or retrieval', async ({
    client,
    assert,
  }) => {
    const ownerEmail = 'rag-existing-owner@docweave.dev'
    const editorEmail = 'rag-existing-editor@docweave.dev'
    const spaceId = 'rag-existing-architecture'
    let accessChecks = 0
    let embeddingCalls = 0
    let retrievalCalls = 0

    await Document.query().where('space_id', spaceId).delete()
    await SpaceMember.query().where('space_id', spaceId).delete()
    await Space.query().where('id', spaceId).delete()
    await User.query().whereIn('email', [ownerEmail, editorEmail]).delete()

    const owner = await User.create({
      email: ownerEmail,
      fullName: 'RAG Existing Owner',
      password: 'docweave123',
    })
    const editor = await User.create({
      email: editorEmail,
      fullName: 'RAG Existing Editor',
      password: 'docweave123',
    })
    const space = await Space.create({
      id: spaceId,
      name: 'Architecture',
      summary: 'Owner-only architecture knowledge.',
    })
    await SpaceMember.create({ spaceId: space.id, userId: owner.id, role: 'owner' })

    const membership = new SpaceMembershipService()
    const rag = new RagService({
      async hasSpaceAccess(userId, checkedSpaceId) {
        accessChecks += 1
        return membership.hasSpaceAccess(userId, checkedSpaceId)
      },
      listVisibleDocuments: membership.listVisibleDocuments.bind(membership),
      async embedQuery() {
        embeddingCalls += 1
        return [0.1, 0.2]
      },
      async retrieve() {
        retrievalCalls += 1
        return []
      },
    })

    app.container.swap(RagService, () => rag)

    try {
      const login = await client.post('/api/auth/login').json({
        email: editor.email,
        password: 'docweave123',
      })
      const token = login.body().data.token as string
      const response = await client
        .post('/api/rag/search')
        .header('authorization', `Bearer ${token}`)
        .json({ searchText: 'architecture', spaceId: space.id })

      response.assertStatus(403)
      assert.deepEqual(response.body() as ApiErrorResponse, {
        code: apiErrors.forbidden.code,
        message: apiErrors.forbidden.message,
      })
      assert.equal(accessChecks, 1)
      assert.equal(embeddingCalls, 0)
      assert.equal(retrievalCalls, 0)
    } finally {
      app.container.restore(RagService)
      await Document.query().where('space_id', spaceId).delete()
      await SpaceMember.query().where('space_id', spaceId).delete()
      await Space.query().where('id', spaceId).delete()
      await User.query().whereIn('email', [ownerEmail, editorEmail]).delete()
    }
  })
})
