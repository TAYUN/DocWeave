import type { ToolContext } from '@jrmc/adonis-mcp/types/context'
import type { BaseSchema } from '@jrmc/adonis-mcp/types/method'

import DocweaveCatalogService from '#services/docweave_catalog_service'
import { Tool } from '@jrmc/adonis-mcp'
import vine from '@vinejs/vine'

type Schema = BaseSchema<{
  spaceId: { type: 'string' }
  title: { type: 'string' }
  summary: { type: 'string' }
}>

const createDocumentSchema = vine.object({
  spaceId: vine.string().trim().meta({
    description: '文档所属空间 ID',
  }),
  title: vine.string().trim().meta({
    description: '新文档标题',
  }),
  summary: vine.string().trim().meta({
    description: '新文档摘要',
  }),
})

export default class CreateDocumentTool extends Tool<Schema> {
  name = 'create_document'
  title = '创建文档'
  description = '在指定空间下创建一篇新的 DocWeave 文档，并返回新文档详情'

  private catalog = new DocweaveCatalogService()

  async handle({ args, response }: ToolContext<Schema>) {
    if (!args) {
      return response.error('spaceId, title, and summary are required')
    }

    // 创建动作直接复用现有服务，保证默认内容、默认状态等业务约束不会在 MCP 层分叉。
    const document = await this.catalog.createDocument({
      spaceId: args.spaceId,
      title: args.title,
      summary: args.summary,
    })

    if (!document) {
      return response.error(`Space not found: ${args.spaceId}`)
    }

    return response.structured({
      message: 'Document created',
      document,
    })
  }

  schema() {
    return vine.create(createDocumentSchema).toJSONSchema() as Schema
  }
}
