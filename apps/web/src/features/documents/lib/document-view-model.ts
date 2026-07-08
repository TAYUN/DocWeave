import { getDocumentStatusLabel, parseDocumentContent } from '@docweave/adapters'
import type {
  DocumentContent,
  DocumentDetailDto,
  DocumentSummaryDto,
} from '@docweave/contracts'

export type DocumentPreviewViewModel = {
  id: string
  title: string
  summaryText: string
  statusLabel: string
  updatedAtText: string
}

export type DocumentEditorViewModel = {
  id: string
  spaceId: string
  title: string
  summary: string
  content: DocumentContent
  statusLabel: string
  updatedAtText: string
}

export function formatDocumentUpdatedAt(value: string | null | undefined) {
  if (!value) return '暂无更新时间'
  return `更新于 ${new Date(value).toLocaleString('zh-CN')}`
}

export function toDocumentPreviewViewModel(
  document: Pick<DocumentSummaryDto, 'id' | 'title' | 'summary' | 'status' | 'updatedAt'>,
): DocumentPreviewViewModel {
  return {
    id: document.id,
    title: document.title,
    summaryText: document.summary || '还没有填写摘要。',
    statusLabel: getDocumentStatusLabel(document.status),
    updatedAtText: formatDocumentUpdatedAt(document.updatedAt),
  }
}

export function toDocumentEditorViewModel(document: DocumentDetailDto): DocumentEditorViewModel {
  return {
    id: document.id,
    spaceId: document.spaceId,
    title: document.title,
    summary: document.summary ?? '',
    content: parseDocumentContent(document.content),
    statusLabel: getDocumentStatusLabel(document.status),
    updatedAtText: formatDocumentUpdatedAt(document.updatedAt),
  }
}
