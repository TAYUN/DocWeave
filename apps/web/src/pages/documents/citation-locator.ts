import type { DocumentEditorInstance } from '@docweave/editor'

type CitationTargetElement = Pick<HTMLElement, 'scrollIntoView' | 'querySelector'>

type CitationEditorSurface = Pick<HTMLElement, 'querySelector' | 'querySelectorAll'>

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

  let attempts = 0
  const maxAttempts = 20

  const tryLocate = () => {
    const block = editor.getBlock(blockId)
    if (block) editor.setTextCursorPosition(block.id, 'start')

    schedule(() => {
      const target = (
        editorSurface?.querySelector<HTMLElement>(
          `[data-node-type="blockContainer"][data-id="${blockId}"], [id="${blockId}"]`,
        ) ??
        Array.from(editorSurface?.querySelectorAll<HTMLElement>('[data-id]') ?? []).find(
          (element) => element.dataset.id === blockId,
        )
      ) as CitationTargetElement | undefined

      if (!target) {
        retry()
        return
      }

      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      target.querySelector<HTMLElement>('[contenteditable="true"]')?.focus({ preventScroll: true })

      // BlockNote 会在协同同步或编辑时重建块节点，不能把 Citation 高亮状态保存在临时 DOM class 上。
      // 页面根据路由参数持续生成 scoped CSS；这里仅负责官方编辑器 API 的定位与聚焦。
      onLocated()
    })
  }

  const retry = () => {
    attempts += 1
    if (attempts >= maxAttempts) {
      onNotFound()
      return
    }

    // 协同编辑器的 Yjs 内容可能比 onReady 晚一个同步周期挂载；短暂重试避免把时序当成块丢失。
    scheduleCleanup(() => schedule(tryLocate), 100)
  }

  tryLocate()
}
