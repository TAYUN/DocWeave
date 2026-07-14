import nodeAssert from 'node:assert/strict'
import { test } from '@japa/runner'
import DocweaveCatalogService from '#services/docweave_catalog_service'
import Space from '#models/space'

test.group('catalog space transaction', () => {
  test('rolls back the space when owner membership creation fails', async ({ assert }) => {
    await Space.query().where('name', 'Rollback space').delete()

    const catalog = new DocweaveCatalogService({
      createOwnerMembership: async () => {
        throw new Error('membership write failed')
      },
    })

    await nodeAssert.rejects(
      () => catalog.createSpace({ name: 'Rollback space', summary: 'Must be atomic.' }, 1),
      /membership write failed/
    )

    assert.isNull(await Space.query().where('name', 'Rollback space').first())
  })
})
