import nodeAssert from 'node:assert/strict'
import { test } from '@japa/runner'
import Document from '#models/document'
import Space from '#models/space'
import SpaceMember from '#models/space_member'
import User from '#models/user'
import SpaceMembershipService from '#services/space_membership_service'

const testSpaceIds = ['legacy-without-mapping', 'private-space', 'role-checked-space']
const testUserEmails = [
  'first-owner@docweave.dev',
  'later-user@docweave.dev',
  'role-owner@docweave.dev',
  'scope-outsider@docweave.dev',
  'scope-owner@docweave.dev',
  'space-owner@docweave.dev',
]

async function clearCatalog() {
  // Functional tests run against the local development database. Only remove fixtures
  // owned by this file so an operator's legacy mappings and catalog remain untouched.
  await Document.query().whereIn('space_id', testSpaceIds).delete()
  await SpaceMember.query().whereIn('space_id', testSpaceIds).delete()
  await Space.query().whereIn('id', testSpaceIds).delete()
  await User.query().whereIn('email', testUserEmails).delete()
}

test.group('space membership flow', () => {
  test('creates exactly one owner membership with a space in the same request flow', async ({
    client,
    assert,
  }) => {
    await clearCatalog()

    const owner = await User.create({
      email: 'space-owner@docweave.dev',
      fullName: 'Space Owner',
      password: 'docweave123',
    })
    const login = await client.post('/api/auth/login').json({
      email: owner.email,
      password: 'docweave123',
    })
    const token = login.body().data.token as string

    const response = await client
      .post('/api/spaces')
      .header('authorization', `Bearer ${token}`)
      .json({ name: 'Member Scope', summary: 'Membership-backed knowledge space.' })

    response.assertStatus(201)
    const spaceId = (response.body().data as { id: string }).id
    const memberships = await SpaceMember.query().where('space_id', spaceId)

    assert.lengthOf(memberships, 1)
    assert.equal(memberships[0].userId, owner.id)
    assert.equal(memberships[0].role, 'owner')
  })

  test('does not infer membership from user creation order', async ({ assert }) => {
    await clearCatalog()

    const firstUser = await User.create({
      email: 'first-owner@docweave.dev',
      fullName: 'First Owner',
      password: 'docweave123',
    })
    const laterUser = await User.create({
      email: 'later-user@docweave.dev',
      fullName: 'Later User',
      password: 'docweave123',
    })
    const space = await Space.create({
      id: 'legacy-without-mapping',
      name: 'Legacy without mapping',
      summary: 'No membership has been explicitly assigned.',
    })
    const membership = new SpaceMembershipService()

    assert.isFalse(await membership.hasSpaceAccess(firstUser.id, space.id))
    assert.isFalse(await membership.hasSpaceAccess(laterUser.id, space.id))
  })

  test('identifies a second user without a membership as unauthorized', async ({ assert }) => {
    await clearCatalog()

    const owner = await User.create({
      email: 'scope-owner@docweave.dev',
      fullName: 'Scope Owner',
      password: 'docweave123',
    })
    const outsider = await User.create({
      email: 'scope-outsider@docweave.dev',
      fullName: 'Scope Outsider',
      password: 'docweave123',
    })
    const space = await Space.create({
      id: 'private-space',
      name: 'Private Space',
      summary: 'Only the owner may retrieve it.',
    })
    await SpaceMember.create({ spaceId: space.id, userId: owner.id, role: 'owner' })

    const membership = new SpaceMembershipService()

    assert.isFalse(await membership.hasSpaceAccess(outsider.id, space.id))
    assert.isTrue(await membership.hasSpaceAccess(owner.id, space.id))
  })

  test('rejects unsupported membership roles at the database boundary', async () => {
    await clearCatalog()

    const owner = await User.create({
      email: 'role-owner@docweave.dev',
      fullName: 'Role Owner',
      password: 'docweave123',
    })
    const space = await Space.create({
      id: 'role-checked-space',
      name: 'Role Checked',
      summary: 'Only supported roles may be persisted.',
    })

    await nodeAssert.rejects(
      () =>
        SpaceMember.create({
          spaceId: space.id,
          userId: owner.id,
          // Runtime constraint must also protect callers outside TypeScript's type system.
          role: 'editor' as never,
        }),
      /space_members_role_check/
    )
  })
})
