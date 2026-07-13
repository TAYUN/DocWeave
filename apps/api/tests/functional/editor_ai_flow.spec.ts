import { test } from '@japa/runner'

test.group('editor ai', () => {
  test('rejects anonymous editor ai requests before provider access', async ({
    client,
    assert,
  }) => {
    const response = await client.post('/api/ai/editor').json({
      documentId: 'missing-document',
      action: 'rewrite',
      messages: [{ role: 'user', parts: [{ type: 'text', text: 'Rewrite this' }] }],
      toolDefinitions: {},
    } as never)

    response.assertStatus(401)
    assert.ok(response)
  })
})
