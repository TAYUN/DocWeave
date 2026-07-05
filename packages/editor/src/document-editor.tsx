import { BlockNoteView } from '@blocknote/mantine'
import type { PartialBlock } from '@blocknote/core'
import { useCreateBlockNote } from '@blocknote/react'
import '@blocknote/core/fonts/inter.css'
// 产品侧已经全局注入 Mantine 核心样式，这里只补 BlockNote 额外样式，避免重复加载。
import '@blocknote/mantine/blocknoteStyles.css'

export type DocumentEditorContent = PartialBlock[]

export type DocumentEditorProps = {
  initialContent: DocumentEditorContent
  editable?: boolean
  onChange: (content: DocumentEditorContent) => void
}

export function DocumentEditor({ initialContent, editable = true, onChange }: DocumentEditorProps) {
  const editor = useCreateBlockNote({ initialContent })

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      onChange={(currentEditor) => onChange(currentEditor.document)}
    />
  )
}
