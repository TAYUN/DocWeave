import type { DocumentEditorInstance } from '@docweave/editor'

type CitationTargetElement = Pick<HTMLElement, 'classList' | 'scrollIntoView' | 'querySelector'>

type CitationEditorSurface = Pick<HTMLElement, 'querySelectorAll'>

export type CitationLocatorOptions = {
  editor: DocumentEditorInstance
  blockId?: string
  editorSurface: CitationEditorSurface | null
  onLocated: () => void
  onNotFound: () => void
  schedule?: (callback: FrameRequestCallback) => number
  scheduleCleanup?: (callback: () => void, delay: number) => number
}

// Citation 指向的是历史快照；当前文档块缺失时只报告状态，不能阻断编辑器加载。
export function locateCitationBlock({
  editor,
  blockId,
  editorSurface,
  onLocated,
  onNotFound,
  schedule = window.requestAnimationFrame.bind(window),
  scheduleCleanup = window.setTimeout.bind(window),
}: CitationLocatorOptions) {
  if (!blockId) return

  const block = editor.getBlock(blockId)
  if (!block) {
    onNotFound()
    return
  }

  editor.setTextCursorPosition(block.id, 'start')
  schedule(() => {
    const target = Array.from(editorSurface?.querySelectorAll<HTMLElement>('[data-id]') ?? []).find(
      (element) => element.dataset.id === block.id,
    ) as CitationTargetElement | undefined

    if (!target) {
      onNotFound()
      return
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    target.querySelector<HTMLElement>('[contenteditable="true"]')?.focus({ preventScroll: true })
    target.classList.add('rag-citation-target')
    scheduleCleanup(() => target.classList.remove('rag-citation-target'), 1800)
    onLocated()
  })
}
