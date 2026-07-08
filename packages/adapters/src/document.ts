import type {
  DocumentDetailDto,
  DocumentStatus,
  DocumentSummaryDto,
} from '@docweave/contracts'
import { createDefaultDocumentContent, serializeDocumentContent } from './content.js'

type IsoDateLike = {
  toISO(): string | null
}

type DateValue = string | IsoDateLike | null | undefined

export type DocumentSummarySource = {
  id: string
  title: string
  status: DocumentStatus | string
  summary: string | null
  spaceId: string
  createdAt?: DateValue
  updatedAt?: DateValue
}

export type DocumentDetailSource = DocumentSummarySource & {
  content?: string | null
}

function normalizeDocumentStatus(status: DocumentStatus | string): DocumentStatus {
  switch (status) {
    case 'draft':
    case 'review':
    case 'ready':
      return status
    default:
      // 契约层只承诺稳定枚举；出现未知状态时先降级，避免脏值继续外溢到页面或下游任务。
      return 'draft'
  }
}

function toIsoString(value: DateValue): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  return value.toISO()
}

export function toDocumentSummaryDto(document: DocumentSummarySource): DocumentSummaryDto {
  return {
    id: document.id,
    title: document.title,
    status: normalizeDocumentStatus(document.status),
    summary: document.summary,
    spaceId: document.spaceId,
    updatedAt: toIsoString(document.updatedAt) ?? toIsoString(document.createdAt),
  }
}

export function toDocumentDetailDto(document: DocumentDetailSource): DocumentDetailDto {
  return {
    ...toDocumentSummaryDto(document),
    // 详情契约必须始终返回合法正文字符串，避免前端和索引链路分别兜底。
    content: document.content ?? serializeDocumentContent(createDefaultDocumentContent()),
  }
}

export function getDocumentStatusLabel(status: DocumentStatus | string) {
  switch (status) {
    case 'draft':
      return '草稿'
    case 'review':
      return '审核中'
    case 'ready':
      return '已就绪'
    default:
      return status
  }
}
