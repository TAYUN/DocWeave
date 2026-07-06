import type { ToolContext } from '@jrmc/adonis-mcp/types/context'
import type { BaseSchema } from '@jrmc/adonis-mcp/types/method'

import DocweaveCatalogService from '#services/docweave_catalog_service'
import { Tool } from '@jrmc/adonis-mcp'
import vine from '@vinejs/vine'

type Schema = BaseSchema<{
  name: { type: 'string' }
  summary: { type: 'string' }
}>

const createSpaceSchema = vine.object({
  name: vine.string().trim().meta({
    description: '空间名称',
  }),
  summary: vine.string().trim().meta({
    description: '空间摘要',
  }),
})

export default class CreateSpaceTool extends Tool<Schema> {
  name = 'create_space'
  title = '创建空间'
  description = '创建一个新的 DocWeave 空间，并返回新空间详情'

  private catalog = new DocweaveCatalogService()

  async handle({ args, response }: ToolContext<Schema>) {
    if (!args) {
      return response.error('name and summary are required')
    }

    // 复用现有 service，保证空间 ID 生成规则和 HTTP API 完全一致，避免 MCP 层单独分叉。
    const space = await this.catalog.createSpace({
      name: args.name,
      summary: args.summary,
    })

    return response.structured({
      message: 'Space created',
      space,
    })
  }

  schema() {
    return vine.create(createSpaceSchema).toJSONSchema() as Schema
  }
}
