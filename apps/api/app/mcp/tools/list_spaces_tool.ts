import type { ToolContext } from '@jrmc/adonis-mcp/types/context'

import DocweaveCatalogService from '#services/docweave_catalog_service'
import { Tool } from '@jrmc/adonis-mcp'
import { isReadOnly } from '@jrmc/adonis-mcp/tool_annotations'

@isReadOnly()
export default class ListSpacesTool extends Tool {
  name = 'list_spaces'
  title = '列出空间列表'
  description = '读取 DocWeave 中所有空间及其根文档 ID，帮助 agent 建立文档工作上下文'

  private catalog = new DocweaveCatalogService()

  async handle({ response }: ToolContext) {
    // 先把空间全量上下文交给 agent，可以减少它在创建或更新文档前的盲查成本。
    const spaces = await this.catalog.listSpaces()

    return response.structured({
      spaces,
    })
  }
}
