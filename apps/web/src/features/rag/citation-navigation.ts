import type { RagCitationViewModel } from './lib'

export type CitationLocationSearch = {
  snapshotVersion: number
  blockId: string
}

// 将 Citation 的稳定定位信息集中序列化，避免搜索和聊天入口生成不同的路由参数。
export function toCitationLocationSearch(citation: RagCitationViewModel): CitationLocationSearch {
  return {
    snapshotVersion: citation.snapshotVersion,
    blockId: citation.blockId,
  }
}
