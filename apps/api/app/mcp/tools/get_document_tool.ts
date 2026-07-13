import type { ToolContext } from '@jrmc/adonis-mcp/types/context'
import type { BaseSchema } from '@jrmc/adonis-mcp/types/method'

import { apiErrors, mcpMessages } from '#exceptions/error_messages'
import DocweaveCatalogService from '#services/docweave_catalog_service'
import { Tool } from '@jrmc/adonis-mcp'
import { isReadOnly } from '@jrmc/adonis-mcp/tool_annotations'
import vine from '@vinejs/vine'

type Schema = BaseSchema<{
  documentId: { type: 'string' }
}>

const getDocumentSchema = vine.object({
  documentId: vine.string().trim().meta({
    description: '要读取的文档 ID',
  }),
})

@isReadOnly()
export default class GetDocumentTool extends Tool<Schema> {
  name = 'get_document'
  title = '获取文档详情'
  description = '按 documentId 读取 DocWeave 文档的标题、摘要、状态和正文内容'

  private catalog = new DocweaveCatalogService()

  async handle({ args, response }: ToolContext<Schema>) {
    const documentId = args?.documentId

    if (!documentId) {
      return response.error(mcpMessages.documentIdRequired)
    }

    // 统一复用现有目录服务，保证 MCP 与 HTTP API 读取到的是同一份业务数据。
    const document = await this.catalog.getDocument(documentId)

    if (!document) {
      return response.error(apiErrors.documentNotFound.message)
    }

    // 结构化返回便于 agent 直接消费，减少额外的 JSON 解析和提示词拼装成本。
    return response.structured({
      document,
    })
  }

  schema() {
    return vine.create(getDocumentSchema).toJSONSchema() as Schema
  }
}
