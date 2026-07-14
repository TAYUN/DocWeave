import { test } from '@japa/runner'
import { apiErrors } from '#exceptions/error_messages'
import CreateSpaceTool from '../../app/mcp/tools/create_space_tool.js'
import SearchKnowledgeTool from '../../app/mcp/tools/search_knowledge_tool.js'

type MockResponseResult =
  | { type: 'structured'; payload: Record<string, unknown> }
  | { type: 'error'; message: string | undefined }

function createMockResponse() {
  return {
    structured(payload: Record<string, unknown>): MockResponseResult {
      return { type: 'structured', payload }
    },
    error(message?: string): MockResponseResult {
      return { type: 'error', message }
    },
  }
}

test.group('MCP identity boundary', () => {
  test('rejects create_space without an MCP user identity mapping', async ({ assert }) => {
    const result = await new CreateSpaceTool().handle({
      args: { name: 'Private space', summary: 'Requires an owner membership.' },
      response: createMockResponse(),
    } as never)

    assert.deepEqual(result, {
      type: 'error',
      message: apiErrors.unauthorized.message,
    })
  })

  test('rejects search_knowledge without instantiating the retrieval service', async ({
    assert,
  }) => {
    const result = await new SearchKnowledgeTool().handle({
      args: { query: 'confidential notes' },
      response: createMockResponse(),
    } as never)

    assert.deepEqual(result, {
      type: 'error',
      message: apiErrors.unauthorized.message,
    })
  })
})
