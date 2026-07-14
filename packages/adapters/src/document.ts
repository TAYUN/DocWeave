import type {
  DocumentDetailDto,
  DocumentStatus,
  DocumentSummaryDto,
} from '@docweave/contracts/document'
import { BlockNoteEditor } from '@blocknote/core'
import { blocksToYDoc, yDocToBlocks } from '@blocknote/core/yjs'
import * as Y from 'yjs'
import {
  createDefaultDocumentContent,
  extractTextPreview,
  parseDocumentContent,
  serializeDocumentContent,
} from './content.js'

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
  content?: string | null
  latestSnapshotVersion?: number | null
  latestIndexedVersion?: number | null
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
  const summary =
    document.summary ??
    (document.content ? extractTextPreview(parseDocumentContent(document.content)) : null)

  return {
    id: document.id,
    title: document.title,
    status: normalizeDocumentStatus(document.status),
    summary,
    spaceId: document.spaceId,
    latestSnapshotVersion: document.latestSnapshotVersion ?? null,
    latestIndexedVersion: document.latestIndexedVersion ?? null,
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

function createServerBlockNoteEditor(initialContent = createDefaultDocumentContent()) {
  // 服务端转换只需要一个最小 editor 宿主，不承担页面渲染职责。
  return BlockNoteEditor.create({
    initialContent,
  })
}

export function restoreYDocFromSerializedContent(input: { content: string; fragmentName: string }) {
  const blocks = parseDocumentContent(input.content)
  const editor = createServerBlockNoteEditor(blocks)
  return blocksToYDoc(editor, blocks, input.fragmentName)
}

export function serializeYDocContent(input: { document: Y.Doc; fragmentName: string }) {
  const editor = createServerBlockNoteEditor()
  const blocks = yDocToBlocks(editor, input.document, input.fragmentName)
  return serializeDocumentContent(blocks)
}
