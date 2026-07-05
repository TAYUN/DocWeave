import { BlockNoteView } from '@blocknote/mantine'
import type { PartialBlock } from '@blocknote/core'
import { useCreateBlockNote } from '@blocknote/react'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'

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
