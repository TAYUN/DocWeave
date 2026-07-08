import { Alert, Badge, Button, Container, Flex, Group, Paper, ScrollArea, Stack, Text, TextInput, Textarea } from '@mantine/core'
import { parseDocumentContent, serializeDocumentContent } from '@docweave/adapters'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ChevronRight, Clock } from 'lucide-react'
import { DocumentEditor } from '@docweave/editor'
import { useEffect, useMemo, useState } from 'react'
import { getDocumentById, updateDocument } from '../../lib/api'
import { MutationNotice } from '../../features/shared/mutation-notice'
import { toDocumentEditorViewModel } from '../../features/documents/lib/document-display'
import { LoadingState } from '../../features/shared/loading-state'
import { ErrorStatePanel, NotFoundStatePanel, RestrictedStatePanel } from '../../features/shared/state-panels'

function getDocumentStateKind(message: string) {
  if (/权限|禁止|forbidden|restricted/i.test(message)) return 'restricted'
  if (/未找到|not found|不存在|404/i.test(message)) return 'not-found'
  return 'error'
}

export function DocumentEditorPage({ documentId }: { documentId: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const documentQuery = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => getDocumentById(documentId),
    retry: false,
  })

  const document = documentQuery.data
  const documentView = useMemo(() => (document ? toDocumentEditorViewModel(document) : null), [document])
  const initialContent = useMemo(() => documentView?.content ?? parseDocumentContent(), [documentView])
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [draftContent, setDraftContent] = useState(initialContent)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!documentView) return
    setTitle(documentView.title)
    setSummary(documentView.summary)
    setDraftContent(documentView.content)
    setError(null)
  }, [documentView])

  const hasUnsavedChanges =
    !!document &&
    (title !== document.title ||
      summary !== document.summary ||
      JSON.stringify(draftContent) !== JSON.stringify(initialContent))

  useEffect(() => {
    if (!hasUnsavedChanges) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = '你有未保存的修改，确定离开吗？'
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasUnsavedChanges])

  const updateDocumentMutation = useMutation({
    mutationFn: updateDocument,
    onSuccess: async (updated) => {
      queryClient.setQueryData(['document', documentId], updated)
      const updatedView = toDocumentEditorViewModel(updated)
      setTitle(updatedView.title)
      setSummary(updatedView.summary)
      setDraftContent(updatedView.content)
      setError(null)
      notifications.show({ color: 'green', title: '保存文档', message: '文档已保存。' })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['document', documentId] }),
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
        queryClient.invalidateQueries({ queryKey: ['spaces'] }),
        queryClient.invalidateQueries({ queryKey: ['space-tree', updated.spaceId] }),
      ])
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : '保存文档失败')
    },
  })

  if (documentQuery.isPending) return <LoadingState label="正在加载文档" />
  if (documentQuery.error instanceof Error) {
    const kind = getDocumentStateKind(documentQuery.error.message)
    if (kind === 'restricted')
      return <RestrictedStatePanel title="当前文档不可编辑" message={documentQuery.error.message} onBack={() => navigate({ to: '/' })} />
    if (kind === 'not-found')
      return <NotFoundStatePanel title="未找到对应文档" message="当前文档可能已被删除。" onBack={() => navigate({ to: '/' })} />
    return <ErrorStatePanel title="加载文档失败" message={documentQuery.error.message} onRetry={() => void documentQuery.refetch()} />
  }
  if (!document)
    return <NotFoundStatePanel title="未找到对应文档" message="当前文档不存在。" onBack={() => navigate({ to: '/' })} />

  const handleSave = () => {
    setError(null)
    updateDocumentMutation.mutate({ documentId, title, summary, content: serializeDocumentContent(draftContent) })
  }

  return (
    <Flex h="100%" className="page-scroll-shell">
      <Stack flex={1} gap={0} className="page-scroll-stack">
        <Group
          className="document-toolbar"
          h="var(--shell-section-height)"
        >
          <Container size={1040} px={{ base: 'md', md: 'lg' }} w="100%">
            <Group h="100%" justify="space-between" wrap="nowrap">
              <Group gap={4} wrap="nowrap">
                <Button
                  className="toolbar-link-button"
                  variant="subtle"
                  color="warmGray"
                  leftSection={<ArrowLeft size={14} />}
                  // 这里是面包屑返回动作，本质上更像“轻量导航链接”，因此统一复用壳层交互样式。
                  onClick={() => navigate({ to: '/spaces/$spaceId', params: { spaceId: document.spaceId } })}
                >
                  返回空间
                </Button>
                <ChevronRight size={12} color="var(--mantine-color-dimmed)" />
                <Text fw={500} truncate>
                  {document.title}
                </Text>
              </Group>

              <Group gap="xs" wrap="nowrap" flex="none">
                {hasUnsavedChanges ? (
                  <Badge size="sm" variant="light" className="status-badge status-badge--warning">
                    未保存
                  </Badge>
                ) : (
                  <Badge size="sm" variant="light" className="status-badge status-badge--success">
                    {documentView?.statusLabel ?? document.status}
                  </Badge>
                )}
              </Group>
            </Group>
          </Container>
        </Group>

        <ScrollArea flex={1}>
          <Container size={1040} px={{ base: 'md', md: 'lg' }} py={{ base: 'md', md: 'xl' }}>
            <Stack gap="md">
              <TextInput
                value={title}
                onChange={(event) => setTitle(event.currentTarget.value)}
                placeholder="文档标题"
                // 标题输入保持“像在纸上直接写标题”的感觉，因此去掉输入框装饰。
                classNames={{ input: 'document-title-input' }}
              />

              <Group gap="xs">
                <Clock size={14} color="var(--mantine-color-dimmed)" />
                <Text size="xs" c="dimmed">
                  {documentView?.updatedAtText ?? '暂无更新时间'}
                </Text>
              </Group>

              <Textarea
                value={summary}
                onChange={(event) => setSummary(event.currentTarget.value)}
                placeholder="添加摘要..."
                autosize
                minRows={2}
                maxRows={4}
              />

              <Paper p="md" withBorder className="editor-surface">
                <DocumentEditor key={document.id} initialContent={draftContent} onChange={setDraftContent} />
              </Paper>

              {hasUnsavedChanges ? (
                <Alert className="status-alert status-alert--warning" color="yellow" variant="light">
                  有未保存的修改。离开页面前请先保存。
                </Alert>
              ) : null}

              <Group justify="space-between" align="center">
                <Button disabled={!hasUnsavedChanges} loading={updateDocumentMutation.isPending} onClick={handleSave}>
                  {updateDocumentMutation.isPending ? '保存中...' : '保存文档'}
                </Button>
                <MutationNotice message={error} />
              </Group>
            </Stack>
          </Container>
        </ScrollArea>
      </Stack>
    </Flex>
  )
}
