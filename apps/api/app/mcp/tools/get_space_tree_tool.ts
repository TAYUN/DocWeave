import type { ToolContext } from '@jrmc/adonis-mcp/types/context'
import type { BaseSchema } from '@jrmc/adonis-mcp/types/method'

import DocweaveCatalogService from '#services/docweave_catalog_service'
import { Tool } from '@jrmc/adonis-mcp'
import { isReadOnly } from '@jrmc/adonis-mcp/tool_annotations'
import vine from '@vinejs/vine'

type Schema = BaseSchema<{
  spaceId: { type: 'string' }
}>

const getSpaceTreeSchema = vine.object({
  spaceId: vine.string().trim().meta({
    description: '要读取树结构的空间 ID',
  }),
})

@isReadOnly()
export default class GetSpaceTreeTool extends Tool<Schema> {
  name = 'get_space_tree'
  title = '获取空间树'
  description = '按 spaceId 读取 DocWeave 空间及其直接文档节点列表'

  private catalog = new DocweaveCatalogService()

  async handle({ args, response }: ToolContext<Schema>) {
    const spaceId = args?.spaceId

    if (!spaceId) {
      return response.error('spaceId is required')
    }

    // 直接复用现有空间树查询，保证 MCP 与 HTTP API 在节点结构和字段命名上保持一致。
    const tree = await this.catalog.getSpaceTree(spaceId)

    if (!tree) {
      return response.error(`Space not found: ${spaceId}`)
    }

    return response.structured({
      tree,
    })
  }

  schema() {
    return vine.create(getSpaceTreeSchema).toJSONSchema() as Schema
  }
}
