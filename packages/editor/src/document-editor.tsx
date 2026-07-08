import { useMantineColorScheme } from '@mantine/core'
import { BlockNoteView, darkDefaultTheme, lightDefaultTheme } from '@blocknote/mantine'
import type { DocumentContent } from '@docweave/contracts/document'
import { useCreateBlockNote } from '@blocknote/react'
import '@blocknote/core/fonts/inter.css'
// 产品侧已经全局注入 Mantine 核心样式，这里只补 BlockNote 额外样式，避免重复加载。
import '@blocknote/mantine/blocknoteStyles.css'

export type DocumentEditorContent = DocumentContent

export type DocumentEditorProps = {
  initialContent: DocumentEditorContent
  editable?: boolean
  onChange: (content: DocumentEditorContent) => void
}

export function DocumentEditor({ initialContent, editable = true, onChange }: DocumentEditorProps) {
  const editor = useCreateBlockNote({ initialContent })
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <BlockNoteView
      className="docweave-blocknote"
      editor={editor}
      editable={editable}
      // 跟随 Mantine 亮暗模式切换 BlockNote 官方主题，避免正文区域仍停留在默认白底。
      theme={isDark ? darkDefaultTheme : lightDefaultTheme}
      onChange={(currentEditor) => onChange(currentEditor.document)}
    />
  )
}
