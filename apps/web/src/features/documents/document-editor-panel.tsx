import { Alert, Button, Paper, Stack, TextInput, Textarea } from '@mantine/core'
import { DocumentEditor, type DocumentEditorContent } from '@docweave/editor'
import { MutationNotice } from '@/features/shared/mutation-notice'

export function DocumentEditorPanel({
  content,
  editorKey,
  error,
  hasUnsavedChanges,
  isSaving,
  onChangeContent,
  onChangeSummary,
  onChangeTitle,
  onSave,
  summary,
  title,
}: {
  content: DocumentEditorContent
  editorKey: string
  error: string | null
  hasUnsavedChanges: boolean
  isSaving: boolean
  onChangeContent: (content: DocumentEditorContent) => void
  onChangeSummary: (summary: string) => void
  onChangeTitle: (title: string) => void
  onSave: () => void
  summary: string
  title: string
}) {
  return (
    <Paper className="section-card" p={{ base: 'lg', md: 'xl' }} withBorder>
      <Stack gap="md">
        <TextInput
          label="标题"
          onChange={(event) => onChangeTitle(event.currentTarget.value)}
          required
          value={title}
        />
        <Textarea
          autosize
          label="摘要"
          minRows={4}
          onChange={(event) => onChangeSummary(event.currentTarget.value)}
          value={summary}
        />
        <Paper className="editor-surface" p={{ base: 'sm', md: 'md' }} withBorder>
          <DocumentEditor key={editorKey} initialContent={content} onChange={onChangeContent} />
        </Paper>
        {hasUnsavedChanges ? (
          <Alert className="status-alert status-alert--warning" color="yellow" variant="light">
            有未保存的修改。离开页面前请先保存，避免正文和元数据丢失。
          </Alert>
        ) : null}
        <Button disabled={!hasUnsavedChanges} loading={isSaving} onClick={onSave}>
          {isSaving ? '保存中...' : '保存文档'}
        </Button>
        <MutationNotice message={error} />
      </Stack>
    </Paper>
  )
}
