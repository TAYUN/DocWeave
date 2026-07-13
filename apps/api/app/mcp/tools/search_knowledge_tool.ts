import type { ToolContext } from '@jrmc/adonis-mcp/types/context'
import type { BaseSchema } from '@jrmc/adonis-mcp/types/method'

import { mcpMessages } from '#exceptions/error_messages'
import RagService from '#services/rag_service'
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

  private rag = new RagService()

  async handle({ args, response }: ToolContext<Schema>) {
    const query = args?.query

    if (!query) {
      return response.error(mcpMessages.queryRequired)
    }

    return response.structured(await this.rag.search(query))
  }

  schema() {
    return vine.create(searchKnowledgeSchema).toJSONSchema() as Schema
  }
}
