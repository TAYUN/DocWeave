import { Badge, Button, Container, Flex, Group, Paper, ScrollArea, Skeleton, Stack, Text, TextInput, Textarea } from '@mantine/core'
import { parseDocumentContent, serializeDocumentContent } from '@docweave/adapters'
import type {
  CollaborationConnectionStatus,
  CollaborationPresenceEntry,
  CollaborationPresenceState,
  CollaborationTokenPayload,
} from '@docweave/contracts/collaboration'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { ArrowLeft, ChevronRight, Clock } from 'lucide-react'
import { DocumentEditor, seedCollaborationFragment } from '@docweave/editor'
import { useEffect, useMemo, useState } from 'react'
import * as Y from 'yjs'
import { toDocumentEditorViewModel } from '@/features/documents/lib/document-display'
import { MutationNotice } from '@/features/shared/mutation-notice'
import { ErrorStatePanel, NotFoundStatePanel, RestrictedStatePanel } from '@/features/shared/state-panels'
import {
  getCollaborationToken,
  getDocumentById,
  readCollaborationTokenPayload,
  updateDocument,
} from '@/lib/api'

const COLLAB_FRAGMENT_NAME = 'document-store'
const COLLAB_BOOT_TIMEOUT_MS = 2500

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
  const collaborationTokenQuery = useQuery({
    queryKey: ['collaboration-token', documentId],
    queryFn: () => getCollaborationToken(documentId),
    enabled: documentQuery.isSuccess,
    retry: false,
  })
  const documentView = useMemo(() => (document ? toDocumentEditorViewModel(document) : null), [document])
  const initialContent = useMemo(() => documentView?.content ?? parseDocumentContent(), [documentView])
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [draftContent, setDraftContent] = useState(initialContent)
  const [error, setError] = useState<string | null>(null)
  const [collaborationStatus, setCollaborationStatus] =
    useState<CollaborationConnectionStatus>('idle')
  const [collaborationRuntime, setCollaborationRuntime] = useState<{
    document: Y.Doc
    fragment: Y.XmlFragment
    payload: CollaborationTokenPayload
    provider: HocuspocusProvider
  } | null>(null)
  const [presenceEntries, setPresenceEntries] = useState<CollaborationPresenceEntry[]>([])
  const [useLocalFallback, setUseLocalFallback] = useState(false)

  useEffect(() => {
    if (!documentView) return
    setTitle(documentView.title)
    setSummary(documentView.summary)
    setDraftContent(documentView.content)
    setError(null)
  }, [documentView])

  useEffect(() => {
    setCollaborationRuntime(null)
    setPresenceEntries([])
    setUseLocalFallback(false)
    setCollaborationStatus(document ? 'connecting' : 'idle')
  }, [document?.id])

  useEffect(() => {
    if (!document || !collaborationTokenQuery.data || useLocalFallback) {
      return
    }

    const payload = readCollaborationTokenPayload(collaborationTokenQuery.data.token)
    const yDoc = new Y.Doc()
    const fragment = yDoc.getXmlFragment(COLLAB_FRAGMENT_NAME)
    const provider = new HocuspocusProvider({
      url: getCollaborationWebsocketUrl(),
      name: collaborationTokenQuery.data.roomName,
      document: yDoc,
      token: collaborationTokenQuery.data.token,
      onAuthenticationFailed: ({ reason }) => {
        setCollaborationStatus('unauthorized')
        setError(reason || '协同认证失败，已切换为本地降级编辑。')
        setUseLocalFallback(true)
      },
      onStatus: ({ status }) => {
        setCollaborationStatus(mapProviderStatus(status))
      },
      onSynced: ({ state }) => {
        if (state) {
          seedCollaborationFragment(yDoc, COLLAB_FRAGMENT_NAME, initialContent)
          setCollaborationStatus('connected')
        }
      },
    })

    provider.setAwarenessField('presence', {
      user: payload.user,
      canEdit: payload.capabilities.canEdit,
    } satisfies CollaborationPresenceState)
    const syncPresence = () => {
      const states = Array.from(provider.awareness?.getStates().values() ?? [])
      const entries = states
        .map((state) => toPresenceEntry(state, payload.user.id))
        .filter((entry): entry is CollaborationPresenceEntry => Boolean(entry))

      setPresenceEntries(
        entries.length > 0
          ? entries
          : [
              {
                ...payload.user,
                canEdit: payload.capabilities.canEdit,
                isCurrentUser: true,
              },
            ],
      )
    }

    syncPresence()
    const presenceTimer = window.setInterval(syncPresence, 500)

    const bootTimeout = window.setTimeout(() => {
      setCollaborationStatus((currentStatus) => {
        if (currentStatus === 'connected') {
          return currentStatus
        }

        setError('协同服务暂时不可用，已切换为本地降级编辑。')
        setUseLocalFallback(true)
        provider.destroy()
        yDoc.destroy()
        return 'error'
      })
    }, COLLAB_BOOT_TIMEOUT_MS)

    setCollaborationRuntime({
      document: yDoc,
      fragment,
      payload,
      provider,
    })

    return () => {
      window.clearTimeout(bootTimeout)
      window.clearInterval(presenceTimer)
      provider.destroy()
      yDoc.destroy()
    }
  }, [collaborationTokenQuery.data, document, useLocalFallback])

  useEffect(() => {
    if (collaborationTokenQuery.isError) {
      setError(
        collaborationTokenQuery.error instanceof Error
          ? `${collaborationTokenQuery.error.message}，已切换为本地降级编辑。`
          : '协同初始化失败，已切换为本地降级编辑。',
      )
      setUseLocalFallback(true)
      setCollaborationStatus('error')
    }
  }, [collaborationTokenQuery.error, collaborationTokenQuery.isError])

  const isCollaborationEditor =
    Boolean(collaborationRuntime) && !useLocalFallback && collaborationStatus === 'connected'
  const hasContentChanges = JSON.stringify(draftContent) !== JSON.stringify(initialContent)

  const hasUnsavedChanges =
    !!document &&
    (title !== document.title ||
      summary !== document.summary ||
      hasContentChanges)

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

  if (documentQuery.isPending) {
    return (
      <Container size={1040} px={{ base: 'md', md: 'lg' }} py={{ base: 'md', md: 'xl' }}>
        <Stack gap="md">
          <Skeleton h={44} radius="sm" w="32%" />
          <Skeleton h={18} radius="sm" w={160} />
          <Skeleton h={56} radius="md" />
          <Skeleton h={420} radius="lg" />
        </Stack>
      </Container>
    )
  }
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
    updateDocumentMutation.mutate({
      documentId,
      title,
      summary,
      ...(hasContentChanges ? { content: serializeDocumentContent(draftContent) } : {}),
    })
  }

  return (
    <Flex className="page-scroll-shell page-scroll-shell--viewport">
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
                {hasUnsavedChanges ? (
                  <Text size="sm" c="dimmed">
                    有未保存修改
                  </Text>
                ) : null}
                <Button
                  size="sm"
                  disabled={!hasUnsavedChanges}
                  loading={updateDocumentMutation.isPending}
                  onClick={handleSave}
                >
                  {updateDocumentMutation.isPending ? '保存中...' : '保存文档'}
                </Button>
              </Group>
            </Group>
          </Container>
        </Group>

        {error ? (
          <Container size={1040} px={{ base: 'md', md: 'lg' }} py="sm" w="100%">
            <MutationNotice message={error} />
          </Container>
        ) : null}

        <ScrollArea flex={1} className="document-scroll-area">
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
                <Badge size="sm" variant="light">
                  {getCollaborationStatusLabel(collaborationStatus, useLocalFallback)}
                </Badge>
                {presenceEntries.length > 0 ? (
                  <Text size="xs" c="dimmed">
                    在线 {presenceEntries.length} 人
                  </Text>
                ) : null}
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
                {isCollaborationEditor && collaborationRuntime ? (
                  <DocumentEditor
                    key={`${document.id}:collaboration`}
                    mode="collaboration"
                    editable={collaborationRuntime.payload.capabilities.canEdit}
                    onChange={setDraftContent}
                    collaboration={{
                      fragment: collaborationRuntime.fragment,
                      provider: {
                        awareness: collaborationRuntime.provider.awareness ?? undefined,
                      },
                      user: {
                        name: getCollaborationDisplayName(collaborationRuntime.payload),
                        color: getCollaborationColor(collaborationRuntime.payload.user.id),
                      },
                    }}
                  />
                ) : collaborationTokenQuery.isPending && !useLocalFallback ? (
                  <Stack gap="sm">
                    <Skeleton h={18} radius="sm" w="30%" />
                    <Skeleton h={240} radius="md" />
                  </Stack>
                ) : (
                  <DocumentEditor
                    key={`${document.id}:standalone`}
                    editable
                    initialContent={initialContent}
                    onChange={setDraftContent}
                  />
                )}
              </Paper>
            </Stack>
          </Container>
        </ScrollArea>
      </Stack>
    </Flex>
  )
}

function getCollaborationWebsocketUrl() {
  return import.meta.env.VITE_COLLAB_WS_URL ?? 'ws://127.0.0.1:3334'
}

function mapProviderStatus(status: 'connecting' | 'connected' | 'disconnected') {
  if (status === 'connecting') return 'connecting'
  if (status === 'connected') return 'connected'
  return 'disconnected'
}

function getCollaborationStatusLabel(
  status: CollaborationConnectionStatus,
  useLocalFallback: boolean,
) {
  if (useLocalFallback) return '本地降级'
  if (status === 'connecting') return '协同连接中'
  if (status === 'connected') return '协同已连接'
  if (status === 'unauthorized') return '协同未授权'
  if (status === 'error') return '协同异常'
  if (status === 'disconnected') return '协同已断开'
  return '协同待机'
}

function getCollaborationDisplayName(payload: CollaborationTokenPayload) {
  return payload.user.fullName?.trim() || payload.user.email
}

function getCollaborationColor(userId: number) {
  const palette = ['#2667ff', '#0f9d58', '#d9480f', '#8e24aa', '#00838f', '#c62828']
  return palette[Math.abs(userId) % palette.length]
}

function toPresenceEntry(
  state: Record<string, unknown>,
  currentUserId: number,
): CollaborationPresenceEntry | null {
  const presence =
    state.presence && typeof state.presence === 'object'
      ? (state.presence as Record<string, unknown>)
      : state
  const user = presence.user

  if (!user || typeof user !== 'object') {
    return null
  }

  const candidate = user as CollaborationTokenPayload['user']

  if (typeof candidate.id !== 'number' || typeof candidate.email !== 'string') {
    return null
  }

  return {
    ...candidate,
    canEdit: Boolean(presence.canEdit),
    isCurrentUser: candidate.id === currentUserId,
  }
}
