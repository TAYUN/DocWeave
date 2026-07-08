import type { DocumentContent } from '@docweave/contracts/document'

export function createDefaultDocumentContent(): DocumentContent {
  return [
    {
      type: 'paragraph',
      content: '从这里开始编写你的文档。',
    },
  ]
}

export function parseDocumentContent(rawContent?: string | null): DocumentContent {
  if (!rawContent) {
    return createDefaultDocumentContent()
  }

  try {
    const parsed = JSON.parse(rawContent) as unknown

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as DocumentContent
    }
  } catch {
    // 持久化内容缺失或损坏时，统一回退到最小可编辑正文，避免页面和服务端各自兜底。
  }

  return createDefaultDocumentContent()
}

export function serializeDocumentContent(content: DocumentContent): string {
  return JSON.stringify(content)
}
