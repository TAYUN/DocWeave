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

/**
 * 从 BlockNote PartialBlock[] 中提取纯文本预览。
 * 递归遍历 blocks 及其 children，仅提取 text 类型的 inline content。
 * 用于 summary 为空时从正文生成列表展示文本。
 */
export function extractTextPreview(
  content: DocumentContent,
  maxLength = 120,
): string {
  const texts: string[] = []

  function walk(blocks: DocumentContent) {
    for (const block of blocks) {
      // block.content 可能是复杂的内联内容类型，通过下标安全访问纯文本。
      const inlineContent = block.content as
        | Array<{ type: string; text?: string; [key: string]: unknown }>
        | undefined
      if (inlineContent) {
        for (const inline of inlineContent) {
          if (inline.type === 'text' && inline.text) {
            texts.push(inline.text)
          }
        }
      }
      if (block.children) {
        walk(block.children as DocumentContent)
      }
      if (texts.join(' ').length >= maxLength) break
    }
  }

  walk(content)
  const joined = texts.join(' ').replace(/\s+/g, ' ').trim()
  if (!joined) return ''
  return joined.length > maxLength ? joined.slice(0, maxLength) + '…' : joined
}
