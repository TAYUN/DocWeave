import { extractTextPreview, parseDocumentContent } from '@docweave/adapters'

export type BuildEditorAiContextInput = {
  title: string
  content: string
  selectedText?: string
  currentBlockId?: string
  maxCharacters?: number
}

export type EditorAiLocalContext = {
  documentTitle: string
  selectedText: string
  currentBlockText: string
  surroundingText: string
}

export function buildEditorAiContext(input: BuildEditorAiContextInput): EditorAiLocalContext {
  const blocks = parseDocumentContent(input.content)
  const currentIndex = input.currentBlockId
    ? blocks.findIndex((block) => block.id === input.currentBlockId)
    : 0
  const safeIndex = currentIndex >= 0 ? currentIndex : 0
  const currentBlock = blocks[safeIndex]
  const surroundingBlocks = blocks.slice(Math.max(0, safeIndex - 2), safeIndex + 3)
  const maxCharacters = input.maxCharacters ?? 4000

  return {
    documentTitle: input.title.trim(),
    selectedText: limit(input.selectedText ?? '', maxCharacters),
    currentBlockText: limit(
      currentBlock ? extractTextPreview([currentBlock], maxCharacters) : '',
      maxCharacters,
    ),
    surroundingText: limit(extractTextPreview(surroundingBlocks, maxCharacters), maxCharacters),
  }
}

function limit(value: string, maxCharacters: number) {
  return value.slice(0, Math.max(0, maxCharacters))
}
