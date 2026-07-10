import { test } from '@japa/runner'
import type { ApiErrorResponse } from '@docweave/contracts/api'
import User from '#models/user'
import Space from '#models/space'
import Document from '#models/document'

test.group('api response envelope', () => {
  test('returns a message for unauthorized api requests', async ({ client, assert }) => {
    await Document.query().delete()
    await Space.query().delete()
    await User.query().delete()

    const response = await client.get('/api/auth/me')

    response.assertStatus(401)

    const body = response.body() as ApiErrorResponse

    assert.isString(body.message)
    assert.isAbove(body.message!.length, 0)
    assert.isUndefined(body.errors)
  })

  test('returns message and errors for validation failures', async ({ client, assert }) => {
    await Document.query().delete()
    await Space.query().delete()
    await User.query().delete()

    const user = await User.create({
      email: 'response-owner@docweave.dev',
      fullName: 'Response Owner',
      password: 'docweave123',
    })

    const loginResponse = await client.post('/api/auth/login').json({
      email: user.email,
      password: 'docweave123',
    })

    loginResponse.assertStatus(200)

    const token = loginResponse.body().data.token as string

    const response = await client
      .post('/api/spaces')
      .header('authorization', `Bearer ${token}`)
      .json({
        name: '',
        summary: '',
      })

    response.assertStatus(422)

    const body = response.body() as ApiErrorResponse

    assert.equal(body.message, 'Validation failed')
    assert.isArray(body.errors)
    assert.isAtLeast(body.errors!.length, 1)
    assert.isString(body.errors![0]!.message)
    assert.isAbove(body.errors![0]!.message!.length, 0)
  })

  test('returns message and errors for collaboration token validation failures', async ({
    client,
    assert,
  }) => {
    await Document.query().delete()
    await Space.query().delete()
    await User.query().delete()

    const user = await User.create({
      email: 'collab-response@docweave.dev',
      fullName: 'Collab Response',
      password: 'docweave123',
    })

    const loginResponse = await client.post('/api/auth/login').json({
      email: user.email,
      password: 'docweave123',
    })

    loginResponse.assertStatus(200)

    const token = loginResponse.body().data.token as string

    const response = await client
      .post('/api/collaboration/token')
      .header('authorization', `Bearer ${token}`)
      .json({
        documentId: '',
      })

    response.assertStatus(422)

    const body = response.body() as ApiErrorResponse

    assert.equal(body.message, 'Validation failed')
    assert.isArray(body.errors)
    assert.equal(body.errors![0]?.field, 'documentId')
  })

  test('returns message and errors for rag search validation failures', async ({
    client,
    assert,
  }) => {
    const response = await client.post('/api/rag/search').json({
      searchText: '',
    })

    response.assertStatus(422)

    const body = response.body() as ApiErrorResponse

    assert.equal(body.message, 'Validation failed')
    assert.isArray(body.errors)
    assert.equal(body.errors![0]?.field, 'searchText')
  })
})
