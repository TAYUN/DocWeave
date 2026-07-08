import type { ApiDocumentSummary, ApiSpace } from '@/lib/api'

export type SpaceSummaryViewModel = {
  id: string
  name: string
  summaryText: string
  detailSummaryText: string
  documentCount: number
  documentCountText: string
  rootDocumentCountText: string
}

export function toSpaceSummaryViewModel(space: ApiSpace): SpaceSummaryViewModel {
  const documentCount = space.rootDocuments.length

  return {
    id: space.id,
    name: space.name,
    summaryText: space.summary || '这个知识空间还没有补充简介。',
    detailSummaryText: space.summary || '这个知识空间还没有补充说明。你可以把专题、项目和团队知识都组织在这里。',
    documentCount,
    documentCountText: `${documentCount} 篇文档`,
    rootDocumentCountText: `${documentCount} 篇根文档`,
  }
}

export function sortDocumentsByUpdatedAt<T extends Pick<ApiDocumentSummary, 'updatedAt'>>(documents: T[]) {
  return [...documents].sort((left, right) => {
    const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0
    const rightTime = right.updatedAt ? new Date(right.updatedAt).getTime() : 0
    return rightTime - leftTime
  })
}

export function formatDocumentUpdatedAtShort(value: string | null | undefined) {
  if (!value) return '暂无更新'
  return new Date(value).toLocaleDateString('zh-CN')
}

export function pickRecentSpaceDocuments(
  spaceId: string,
  documents: ApiDocumentSummary[],
  limit = 3,
) {
  return sortDocumentsByUpdatedAt(
    documents.filter((document) => document.spaceId === spaceId),
  ).slice(0, limit)
}
