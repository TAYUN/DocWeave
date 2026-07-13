import type { ToolContext } from '@jrmc/adonis-mcp/types/context'
import type { BaseSchema } from '@jrmc/adonis-mcp/types/method'

import { apiErrors, apiSuccessMessages, mcpMessages } from '#exceptions/error_messages'
import DocumentProcessingService, {
  MissingStableSnapshotError,
  SnapshotVersionNotFoundError,
} from '#services/document_processing_service'
import { Tool } from '@jrmc/adonis-mcp'
import vine from '@vinejs/vine'

type Schema = BaseSchema<{
  documentId: { type: 'string' }
  snapshotVersion: { type: 'number'; optional: true }
}>

const triggerDocumentIndexSchema = vine.object({
  documentId: vine.string().trim().meta({
    description: '要触发索引任务的文档 ID',
  }),
  snapshotVersion: vine.number().positive().withoutDecimals().optional().meta({
    description: '指定索引的稳定快照版本；不传时默认使用文档当前 latestSnapshotVersion',
  }),
})

export default class TriggerDocumentIndexTool extends Tool<Schema> {
  name = 'trigger_document_index'
  title = '触发文档索引'
  description = '为指定文档创建或复用索引任务，让稳定快照进入后续 RAG 处理链路'

  private processing = new DocumentProcessingService()

  async handle({ args, response }: ToolContext<Schema>) {
    const documentId = args?.documentId

    if (!documentId) {
      return response.error(mcpMessages.documentIdRequired)
    }

    try {
      // MCP 层只负责收口参数与返回结构，索引任务去重和 superseded 规则继续由服务层统一维护。
      const result = await this.processing.triggerIndex(documentId, null, {
        snapshotVersion: args?.snapshotVersion,
      })

      if (!result) {
        return response.error(apiErrors.documentNotFound.message)
      }

      return response.structured({
        message: apiSuccessMessages.documentIndexTriggered,
        job: result.job,
        latestSnapshotVersion: result.latestSnapshotVersion,
        latestIndexedVersion: result.latestIndexedVersion,
      })
    } catch (error) {
      if (
        error instanceof MissingStableSnapshotError ||
        error instanceof SnapshotVersionNotFoundError
      ) {
        return response.error(error.message)
      }

      throw error
    }
  }

  schema() {
    return vine.create(triggerDocumentIndexSchema).toJSONSchema() as Schema
  }
}
