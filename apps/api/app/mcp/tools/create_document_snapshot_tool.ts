import type { ToolContext } from '@jrmc/adonis-mcp/types/context'
import type { BaseSchema } from '@jrmc/adonis-mcp/types/method'

import { apiErrors, apiSuccessMessages, mcpMessages } from '#exceptions/error_messages'
import DocumentProcessingService from '#services/document_processing_service'
import { Tool } from '@jrmc/adonis-mcp'
import vine from '@vinejs/vine'

type Schema = BaseSchema<{
  documentId: { type: 'string' }
}>

const createDocumentSnapshotSchema = vine.object({
  documentId: vine.string().trim().meta({
    description: '要创建稳定快照的文档 ID',
  }),
})

export default class CreateDocumentSnapshotTool extends Tool<Schema> {
  name = 'create_document_snapshot'
  title = '创建文档稳定快照'
  description = '为指定文档创建稳定快照；若正文未变化，则返回当前最新快照版本'

  private processing = new DocumentProcessingService()

  async handle({ args, response }: ToolContext<Schema>) {
    const documentId = args?.documentId

    if (!documentId) {
      return response.error(mcpMessages.documentIdRequired)
    }

    // 直接复用快照服务，确保 MCP 与 HTTP API 对“是否需要新版本”的判断完全一致。
    const result = await this.processing.createSnapshot(documentId)

    if (!result) {
      return response.error(apiErrors.documentNotFound.message)
    }

    return response.structured({
      message: apiSuccessMessages.documentSnapshotCreated,
      snapshot: result.snapshot,
      latestSnapshotVersion: result.latestSnapshotVersion,
    })
  }

  schema() {
    return vine.create(createDocumentSnapshotSchema).toJSONSchema() as Schema
  }
}
