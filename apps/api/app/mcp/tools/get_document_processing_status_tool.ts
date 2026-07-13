import type { ToolContext } from '@jrmc/adonis-mcp/types/context'
import type { BaseSchema } from '@jrmc/adonis-mcp/types/method'

import { apiErrors, mcpMessages } from '#exceptions/error_messages'
import DocumentProcessingService from '#services/document_processing_service'
import { Tool } from '@jrmc/adonis-mcp'
import { isReadOnly } from '@jrmc/adonis-mcp/tool_annotations'
import vine from '@vinejs/vine'

type Schema = BaseSchema<{
  documentId: { type: 'string' }
}>

const getDocumentProcessingStatusSchema = vine.object({
  documentId: vine.string().trim().meta({
    description: '要查询处理状态的文档 ID',
  }),
})

@isReadOnly()
export default class GetDocumentProcessingStatusTool extends Tool<Schema> {
  name = 'get_document_processing_status'
  title = '获取文档处理状态'
  description = '读取文档的最新稳定快照版本、已索引版本以及当前最新索引任务状态'

  private processing = new DocumentProcessingService()

  async handle({ args, response }: ToolContext<Schema>) {
    const documentId = args?.documentId

    if (!documentId) {
      return response.error(mcpMessages.documentIdRequired)
    }

    // 统一复用状态聚合服务，避免 MCP 自己拼装快照和索引任务摘要。
    const status = await this.processing.getStatus(documentId)

    if (!status) {
      return response.error(apiErrors.documentNotFound.message)
    }

    return response.structured({
      status,
    })
  }

  schema() {
    return vine.create(getDocumentProcessingStatusSchema).toJSONSchema() as Schema
  }
}
