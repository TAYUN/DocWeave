import { test } from '@japa/runner'
import User from '#models/user'
import Space from '#models/space'
import Document from '#models/document'

test.group('auth workbench flow', () => {
  test('rejects anonymous workbench access and supports real login/logout flow', async ({
    client,
    assert,
  }) => {
    await Document.query().delete()
    await Space.query().delete()
    await User.query().delete()

    const user = await User.create({
      email: 'owner@docweave.dev',
      fullName: 'DocWeave Owner',
      password: 'docweave123',
    })

    await Space.create({
      id: 'product',
      name: 'Product Workspace',
      summary: 'Owns workspace UX, editor surfaces, and user-facing flows.',
    })

    const anonymousMeResponse = await client.get('/api/auth/me')
    anonymousMeResponse.assertStatus(401)

    const anonymousSpacesResponse = await client.get('/api/spaces')
    anonymousSpacesResponse.assertStatus(401)

    const loginResponse = await client.post('/api/auth/login').json({
      email: user.email,
      password: 'docweave123',
    })

    loginResponse.assertStatus(200)
    loginResponse.assertBodyContains({
      data: {
        user: {
          email: user.email,
        },
      },
    })

    const loginBody = loginResponse.body()
    const token = loginBody.data.token as string
    assert.isString(token)
    assert.isNotEmpty(token)

    const meResponse = await client.get('/api/auth/me').header('authorization', `Bearer ${token}`)
    meResponse.assertStatus(200)
    meResponse.assertBodyContains({
      data: {
        email: user.email,
      },
    })

    const spacesResponse = await client
      .get('/api/spaces')
      .header('authorization', `Bearer ${token}`)
    spacesResponse.assertStatus(200)
    spacesResponse.assertBodyContains({
      data: [
        {
          id: 'product',
        },
      ],
    })

    const logoutResponse = await client
      .post('/api/auth/logout')
      .header('authorization', `Bearer ${token}`)
    logoutResponse.assertStatus(200)

    const staleTokenResponse = await client
      .get('/api/auth/me')
      .header('authorization', `Bearer ${token}`)
    staleTokenResponse.assertStatus(401)
  })
})
