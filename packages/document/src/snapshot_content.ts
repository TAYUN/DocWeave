import { extractTextPreview, parseDocumentContent } from '@docweave/adapters'
import type { DocumentSnapshotContentFormat } from '@docweave/contracts/document'

export type ReadSnapshotContentInput = {
  content: string
  contentFormat: DocumentSnapshotContentFormat
}

export type ReadSnapshotContentResult = {
  plainText: string
  blocks: ReturnType<typeof parseDocumentContent>
}

export function readSnapshotContent(snapshot: ReadSnapshotContentInput): ReadSnapshotContentResult {
  if (snapshot.contentFormat !== 'blocknote_json') {
    throw new Error(`Unsupported snapshot content format: ${snapshot.contentFormat}`)
  }

  const blocks = parseDocumentContent(snapshot.content)

  return {
    // 这里故意复用现有内容提取逻辑，M4 先把“能稳定拿到纯文本”做实，不提前引入新的正文解析栈。
    plainText: extractTextPreview(blocks, Number.MAX_SAFE_INTEGER),
    blocks,
  }
}
