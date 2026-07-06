import type { ToolContext } from '@jrmc/adonis-mcp/types/context'
import type { BaseSchema } from '@jrmc/adonis-mcp/types/method'

import { Tool } from '@jrmc/adonis-mcp'
import { isReadOnly } from '@jrmc/adonis-mcp/tool_annotations'
import vine from '@vinejs/vine'

type Schema = BaseSchema<{
  query: { type: 'string' }
}>

const searchKnowledgeSchema = vine.object({
  query: vine.string().trim().meta({
    description: '知识检索查询词',
  }),
})

@isReadOnly()
export default class SearchKnowledgeTool extends Tool<Schema> {
  name = 'search_knowledge'
  title = '检索知识库'
  description = '按查询词检索 DocWeave 知识库，返回当前可用的 RAG 命中结果'

  async handle({ args, response }: ToolContext<Schema>) {
    const query = args?.query

    if (!query) {
      return response.error('query is required')
    }

    // 当前 RAG 仍是 scaffold，这里先与现有 HTTP 接口保持同一份占位返回，避免两条链路各自漂移。
    return response.structured({
      query,
      hits: [
        {
          documentId: 'doc-rag-pipeline',
          score: 0.92,
          snippet: 'Snapshot, chunking, and embedding run in worker-owned stages.',
        },
      ],
    })
  }

  schema() {
    return vine.create(searchKnowledgeSchema).toJSONSchema() as Schema
  }
}
