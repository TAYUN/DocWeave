import type { ToolContext } from '@jrmc/adonis-mcp/types/context'
import type { BaseSchema } from '@jrmc/adonis-mcp/types/method'

import { apiErrors, apiSuccessMessages, mcpMessages } from '#exceptions/error_messages'
import DocweaveCatalogService from '#services/docweave_catalog_service'
import { Tool } from '@jrmc/adonis-mcp'
import vine from '@vinejs/vine'

type Schema = BaseSchema<{
  documentId: { type: 'string' }
  title: { type: 'string' }
  summary: { type: 'string' }
  content: { type: 'string' }
}>

const updateDocumentSchema = vine.object({
  documentId: vine.string().trim().meta({
    description: '要更新的文档 ID',
  }),
  title: vine.string().trim().optional().meta({
    description: '更新后的文档标题',
  }),
  summary: vine.string().trim().optional().meta({
    description: '更新后的文档摘要',
  }),
  content: vine.string().trim().optional().meta({
    description: '更新后的文档正文，通常是序列化后的 BlockNote JSON 字符串',
  }),
})

export default class UpdateDocumentTool extends Tool<Schema> {
  name = 'update_document'
  title = '更新文档'
  description = '按 documentId 更新 DocWeave 文档的标题、摘要或正文内容'

  private catalog = new DocweaveCatalogService()

  async handle({ args, response }: ToolContext<Schema>) {
    if (!args?.documentId) {
      return response.error(mcpMessages.documentIdRequired)
    }

    const patch = {
      title: args.title,
      summary: args.summary,
      content: args.content,
    }

    if (patch.title === undefined && patch.summary === undefined && patch.content === undefined) {
      return response.error(apiErrors.documentPatchEmpty.message)
    }

    // 这里只允许更新明确透出的字段，避免 agent 越过当前 HTTP API 的可编辑边界。
    const document = await this.catalog.updateDocument(args.documentId, patch)

    if (!document) {
      return response.error(apiErrors.documentNotFound.message)
    }

    return response.structured({
      message: apiSuccessMessages.documentUpdated,
      document,
    })
  }

  schema() {
    return vine.create(updateDocumentSchema).toJSONSchema() as Schema
  }
}
