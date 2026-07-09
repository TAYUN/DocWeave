import { useMantineColorScheme } from '@mantine/core'
import { BlockNoteView, darkDefaultTheme, lightDefaultTheme } from '@blocknote/mantine'
import { BlockNoteEditor, type BlockNoteEditorOptions } from '@blocknote/core'
import { blocksToYDoc } from '@blocknote/core/yjs'
import type { DocumentContent } from '@docweave/contracts/document'
import { useCreateBlockNote } from '@blocknote/react'
import * as Y from 'yjs'
import '@blocknote/core/fonts/inter.css'
// 产品侧已经全局注入 Mantine 核心样式，这里只补 BlockNote 额外样式，避免重复加载。
import '@blocknote/mantine/blocknoteStyles.css'

export type DocumentEditorContent = DocumentContent
export type DocumentEditorCollaboration = NonNullable<
  BlockNoteEditorOptions<any, any, any>['collaboration']
>

type DocumentEditorStandaloneProps = {
  mode?: 'standalone'
  initialContent: DocumentEditorContent
  onChange: (content: DocumentEditorContent) => void
}

type DocumentEditorCollaborationProps = {
  mode: 'collaboration'
  collaboration: DocumentEditorCollaboration
  onChange?: (content: DocumentEditorContent) => void
}

export type DocumentEditorProps = {
  editable?: boolean
} & (DocumentEditorStandaloneProps | DocumentEditorCollaborationProps)

export function DocumentEditor(props: DocumentEditorProps) {
  const editor = useCreateBlockNote(
    props.mode === 'collaboration'
      ? {
          collaboration: props.collaboration,
        }
      : {
          initialContent: props.initialContent,
        },
    [props.mode === 'collaboration' ? props.collaboration.fragment : props.initialContent],
  )
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <BlockNoteView
      className="docweave-blocknote"
      editor={editor}
      editable={props.editable ?? true}
      // 跟随 Mantine 亮暗模式切换 BlockNote 官方主题，避免正文区域仍停留在默认白底。
      theme={isDark ? darkDefaultTheme : lightDefaultTheme}
      onChange={(currentEditor) => props.onChange?.(currentEditor.document)}
    />
  )
}

export function seedCollaborationFragment(
  document: Y.Doc,
  fragmentName: string,
  initialContent: DocumentEditorContent,
) {
  const fragment = document.getXmlFragment(fragmentName)

  if (fragment.length > 0 || initialContent.length === 0) {
    return
  }

  const seedEditor = BlockNoteEditor.create({ initialContent })
  const seedDocument = blocksToYDoc(seedEditor, initialContent, fragmentName)
  Y.applyUpdate(document, Y.encodeStateAsUpdate(seedDocument))
}
