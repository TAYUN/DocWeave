import type { ToolContext } from '@jrmc/adonis-mcp/types/context'
import type { BaseSchema } from '@jrmc/adonis-mcp/types/method'

import { apiErrors, mcpMessages } from '#exceptions/error_messages'
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

  async handle({ args, response }: ToolContext<Schema>) {
    if (!args) {
      return response.error(mcpMessages.nameAndSummaryRequired)
    }

    // MCP 尚无用户身份映射，不能创建没有 owner membership 的空间。
    return response.error(apiErrors.unauthorized.message)
  }

  schema() {
    return vine.create(createSpaceSchema).toJSONSchema() as Schema
  }
}
