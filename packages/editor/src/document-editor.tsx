import { useEffect } from 'react'
import { useMantineColorScheme } from '@mantine/core'
import { BlockNoteView, darkDefaultTheme, lightDefaultTheme } from '@blocknote/mantine'
import { BlockNoteEditor, type BlockNoteEditorOptions } from '@blocknote/core'
import { en } from '@blocknote/core/locales'
import { filterSuggestionItems } from '@blocknote/core/extensions'
import { blocksToYDoc } from '@blocknote/core/yjs'
import type { DocumentContent } from '@docweave/contracts/document'
import {
  FormattingToolbar,
  FormattingToolbarController,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
  getFormattingToolbarItems,
  useCreateBlockNote,
} from '@blocknote/react'
import {
  AIMenu,
  AIExtension,
  AIMenuController,
  AIToolbarButton,
  getDefaultAIMenuItems,
  getAISlashMenuItems,
} from '@blocknote/xl-ai'
import { en as aiEn } from '@blocknote/xl-ai/locales'
import { DefaultChatTransport } from 'ai'
import * as Y from 'yjs'
import '@blocknote/core/fonts/inter.css'
// 产品侧已经全局注入 Mantine 核心样式，这里只补 BlockNote 额外样式，避免重复加载。
import '@blocknote/mantine/blocknoteStyles.css'
import '@blocknote/xl-ai/style.css'

export type DocumentEditorContent = DocumentContent
export type DocumentEditorCollaboration = NonNullable<
  BlockNoteEditorOptions<any, any, any>['collaboration']
>

type DocumentEditorStandaloneProps = {
  mode?: 'standalone'
  initialContent: DocumentEditorContent
  onChange: (content: DocumentEditorContent, editor: DocumentEditorInstance) => void
}

type DocumentEditorCollaborationProps = {
  mode: 'collaboration'
  collaboration: DocumentEditorCollaboration
  onChange?: (content: DocumentEditorContent, editor: DocumentEditorInstance) => void
}

export type DocumentEditorAiProps = {
  api: string
  documentId: string
  headers?: () => Record<string, string>
}

export type DocumentEditorInstance = Pick<
  BlockNoteEditor<any, any, any>,
  'getBlock' | 'setTextCursorPosition'
>

export type DocumentEditorProps = {
  editable?: boolean
  ai?: DocumentEditorAiProps
  onReady?: (editor: DocumentEditorInstance) => void
} & (DocumentEditorStandaloneProps | DocumentEditorCollaborationProps)

export function DocumentEditor(props: DocumentEditorProps) {
  const ai = props.ai
  const editor = useCreateBlockNote(
    props.mode === 'collaboration'
      ? {
          collaboration: props.collaboration,
          ...buildAiOptions(ai),
        }
      : {
          initialContent: props.initialContent,
          ...buildAiOptions(ai),
        },
    [
      props.mode === 'collaboration' ? props.collaboration.fragment : props.initialContent,
      ai?.api,
      ai?.documentId,
    ]
  )
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

  const aiEnabled = Boolean(ai)

  useEffect(() => {
    props.onReady?.(editor)
  }, [editor, props.onReady])

  return (
    <BlockNoteView
      className="docweave-blocknote"
      editor={editor}
      editable={props.editable ?? true}
      // 跟随 Mantine 亮暗模式切换 BlockNote 官方主题，避免正文区域仍停留在默认白底。
      theme={isDark ? darkDefaultTheme : lightDefaultTheme}
      formattingToolbar={aiEnabled ? false : undefined}
      slashMenu={aiEnabled ? false : undefined}
      onChange={(currentEditor) => props.onChange?.(currentEditor.document, currentEditor)}
    >
      {aiEnabled ? (
        <AIMenuController
          aiMenu={props.mode === 'collaboration' ? CollaborationAIMenu : undefined}
        />
      ) : null}
      {aiEnabled ? (
        <FormattingToolbarController formattingToolbar={FormattingToolbarWithAI} />
      ) : null}
      {aiEnabled ? (
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) =>
            filterSuggestionItems(
              [...getDefaultReactSlashMenuItems(editor), ...getAISlashMenuItems(editor)],
              query
            )
          }
        />
      ) : null}
    </BlockNoteView>
  )
}

function buildAiOptions(ai: DocumentEditorAiProps | undefined) {
  if (!ai) {
    return {}
  }

  return {
    dictionary: {
      ...en,
      ai: aiEn,
    },
    extensions: [
      AIExtension({
        transport: new DefaultChatTransport({
          api: ai.api,
          headers: ai.headers,
          body: {
            documentId: ai.documentId,
          },
        }),
      }),
    ],
  }
}

function FormattingToolbarWithAI() {
  return (
    <FormattingToolbar>
      {getFormattingToolbarItems()}
      <AIToolbarButton />
    </FormattingToolbar>
  )
}

function CollaborationAIMenu() {
  return (
    <AIMenu
      items={(currentEditor, status) =>
        getDefaultAIMenuItems(currentEditor, status).map((item) => {
          if (item.key !== 'accept') {
            return item
          }

          return {
            ...item,
            onItemClick: (setPrompt: (userPrompt: string) => void) => {
              const selectedBlockId = currentEditor.getSelection()?.blocks.at(-1)?.id
              const targetBlock =
                (selectedBlockId ? currentEditor.getBlock(selectedBlockId) : undefined) ??
                currentEditor.document[0]

              if (targetBlock) {
                // BlockNote 0.51.4 的协同 AI merge 会重建 Yjs 同步插件；先把 selection
                // 收敛到当前仍存在的文本块，避免旧文档位置映射到 doc 根节点。
                currentEditor.setTextCursorPosition(targetBlock.id, 'end')
              }

              item.onItemClick(setPrompt)
            },
          }
        })
      }
    />
  )
}

export function seedCollaborationFragment(
  document: Y.Doc,
  fragmentName: string,
  initialContent: DocumentEditorContent
) {
  const fragment = document.getXmlFragment(fragmentName)

  if (fragment.length > 0 || initialContent.length === 0) {
    return
  }

  const seedEditor = BlockNoteEditor.create({ initialContent })
  const seedDocument = blocksToYDoc(seedEditor, initialContent, fragmentName)
  Y.applyUpdate(document, Y.encodeStateAsUpdate(seedDocument))
}
