import { Alert, Badge, Button, Container, Flex, Group, Paper, ScrollArea, Skeleton, Stack, Text, TextInput, Textarea } from '@mantine/core'
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
import { ArrowLeft, ChevronRight, Clock, Database, Save } from 'lucide-react'
import { DocumentEditor, seedCollaborationFragment, type DocumentEditorInstance } from '@docweave/editor'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as Y from 'yjs'
import { toDocumentEditorViewModel } from '@/features/documents/lib/document-display'
import { MutationNotice } from '@/features/shared/mutation-notice'
import { ErrorStatePanel, NotFoundStatePanel, RestrictedStatePanel } from '@/features/shared/state-panels'
import {
  getCollaborationToken,
  createDocumentSnapshot,
  getDocumentById,
  getDocumentProcessingStatus,
  readCollaborationTokenPayload,
  triggerDocumentIndex,
  updateDocument,
} from '@/lib/api'
import { getAccessToken } from '@/lib/auth'
import { locateCitationBlock } from './citation-locator'

const COLLAB_FRAGMENT_NAME = 'document-store'
const COLLAB_BOOT_TIMEOUT_MS = 2500

function getEditorAiHeaders(): Record<string, string> {
  const token = getAccessToken()

  // BlockNote AI 使用 AI SDK 自己的 fetch 链路，不会复用 Tuyau 的认证 hook。
  // 每次请求动态读取 token，确保登录态变化后不会继续发送旧凭证。
  return token ? { authorization: `Bearer ${token}` } : {}
}

function getDocumentStateKind(message: string) {
  if (/权限|禁止|forbidden|restricted/i.test(message)) return 'restricted'
  if (/未找到|not found|不存在|404/i.test(message)) return 'not-found'
  return 'error'
}

export function DocumentEditorPage({
  documentId,
  citationLocation,
}: {
  documentId: string
  citationLocation?: { snapshotVersion?: number; blockId?: string }
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const documentQuery = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => getDocumentById(documentId),
    retry: false,
  })

  const document = documentQuery.data
  const documentIdValue = document?.id
  const collaborationTokenQuery = useQuery({
    queryKey: ['collaboration-token', documentId],
    queryFn: () => getCollaborationToken(documentId),
    enabled: documentQuery.isSuccess,
    retry: false,
  })
  const processingStatusQuery = useQuery({
    queryKey: ['document-processing-status', documentId],
    queryFn: () => getDocumentProcessingStatus(documentId),
    enabled: documentQuery.isSuccess,
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.latestIndexJob?.status
      return status === 'pending' || status === 'running' ? 3000 : false
    },
  })
  const documentView = useMemo(() => (document ? toDocumentEditorViewModel(document) : null), [document])
  const initialContent = useMemo(() => documentView?.content ?? parseDocumentContent(), [documentView])
  const initialContentRef = useRef(initialContent)
  const editorSurfaceRef = useRef<HTMLDivElement>(null)
  const hasDocument = Boolean(document)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [draftContent, setDraftContent] = useState(initialContent)
  const [savedContent, setSavedContent] = useState(initialContent)
  const hasEstablishedEditorBaselineRef = useRef(false)
  const initializedDocumentIdRef = useRef<string | null>(null)
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
  const [citationFocusState, setCitationFocusState] = useState<'pending' | 'located' | 'not-found'>('pending')
  const citationLocatedRef = useRef(false)

  useEffect(() => {
    citationLocatedRef.current = false
    setCitationFocusState('pending')
  }, [citationLocation?.blockId, citationLocation?.snapshotVersion])

  const handleLocateCitationBlock = useCallback((editor: DocumentEditorInstance) => {
    locateCitationBlock({
      editor,
      blockId: citationLocation?.blockId,
      editorSurface: editorSurfaceRef.current,
      onLocated: () => {
        citationLocatedRef.current = true
        setCitationFocusState('located')
      },
      onNotFound: () => setCitationFocusState('not-found'),
    })
  }, [citationLocation?.blockId])

  useEffect(() => {
    if (!documentView) return
    if (initializedDocumentIdRef.current === documentView.id) return

    initializedDocumentIdRef.current = documentView.id
    setTitle(documentView.title)
    setSummary(documentView.summary)
    setDraftContent(documentView.content)
    setSavedContent(documentView.content)
    hasEstablishedEditorBaselineRef.current = false
    setError(null)
  }, [documentView])

  useEffect(() => {
    initialContentRef.current = initialContent
  }, [initialContent])

  useEffect(() => {
    setCollaborationRuntime(null)
    setPresenceEntries([])
    setUseLocalFallback(false)
    setCollaborationStatus(hasDocument ? 'connecting' : 'idle')
  }, [document?.id, hasDocument])

  useEffect(() => {
    if (!documentIdValue || !collaborationTokenQuery.data || useLocalFallback) {
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
          // 服务端恢复正文为空时，才让现有 seed 兜底；一旦房间里已有恢复内容，这里不会覆盖它。
          seedCollaborationFragment(yDoc, COLLAB_FRAGMENT_NAME, initialContentRef.current)
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
  }, [collaborationTokenQuery.data, documentIdValue, useLocalFallback])

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
  const isCollaborationUnavailable = useLocalFallback || collaborationTokenQuery.isError
  const hasContentChanges = JSON.stringify(draftContent) !== JSON.stringify(savedContent)

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
      setSavedContent(updatedView.content)
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

  const snapshotMutation = useMutation({
    mutationFn: createDocumentSnapshot,
    onSuccess: async (result) => {
      notifications.show({
        color: 'green',
        title: '稳定快照已创建',
        message: `当前文档已保存为快照 v${result.latestSnapshotVersion}。`,
      })
      await queryClient.invalidateQueries({ queryKey: ['document-processing-status', documentId] })
      await queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : '创建稳定快照失败')
    },
  })

  const indexMutation = useMutation({
    mutationFn: ({ targetDocumentId, snapshotVersion }: { targetDocumentId: string; snapshotVersion: number }) =>
      triggerDocumentIndex(targetDocumentId, snapshotVersion),
    onSuccess: async (result) => {
      notifications.show({
        color: 'blue',
        title: '知识库索引已提交',
        message: `快照 v${result.job.targetSnapshotVersion} 正在后台建立索引。`,
      })
      await queryClient.invalidateQueries({ queryKey: ['document-processing-status', documentId] })
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : '提交知识库索引失败')
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

  const handleEditorChange = (content: typeof draftContent) => {
    // BlockNote/Yjs 初次同步会把持久化的简化 blocks 规范化为 editor document。
    // 这是初始化，不是用户改动；以规范化结果建立保存基线后再开始追踪真实编辑。
    if (!hasEstablishedEditorBaselineRef.current) {
      hasEstablishedEditorBaselineRef.current = true
      setSavedContent(content)
    }

    setDraftContent(content)
  }

  const handleDocumentEditorChange = (
    content: typeof draftContent,
    editor: DocumentEditorInstance,
  ) => {
    handleEditorChange(content)

    // 协同正文在 onReady 后仍可能异步挂载；以实际内容变更为第二个定位时机。
    if (citationLocation?.blockId && !citationLocatedRef.current) {
      handleLocateCitationBlock(editor)
    }
  }

  const handleSave = () => {
    setError(null)
    updateDocumentMutation.mutate({
      documentId,
      title,
      summary,
      ...(hasContentChanges ? { content: serializeDocumentContent(draftContent) } : {}),
    })
  }

  const handleCreateSnapshot = async () => {
    setError(null)

    if (hasUnsavedChanges) {
      await updateDocumentMutation.mutateAsync({
        documentId,
        title,
        summary,
        content: serializeDocumentContent(draftContent),
      })
    }

    await snapshotMutation.mutateAsync(documentId)
  }

  const latestSnapshotVersion = processingStatusQuery.data?.latestSnapshotVersion ?? null
  const latestIndexedVersion = processingStatusQuery.data?.latestIndexedVersion ?? null
  const indexJob = processingStatusQuery.data?.latestIndexJob
  const isIndexing = indexJob?.status === 'pending' || indexJob?.status === 'running'
  const isCurrentSnapshotIndexed =
    latestSnapshotVersion !== null && latestSnapshotVersion === latestIndexedVersion

  const handleTriggerIndex = () => {
    if (latestSnapshotVersion === null) return
    setError(null)
    indexMutation.mutate({ targetDocumentId: documentId, snapshotVersion: latestSnapshotVersion })
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
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<Save size={14} />}
                  loading={snapshotMutation.isPending}
                  disabled={updateDocumentMutation.isPending || indexMutation.isPending}
                  onClick={() => void handleCreateSnapshot()}
                >
                  {hasUnsavedChanges ? '保存并创建快照' : '创建稳定快照'}
                </Button>
                <Button
                  size="sm"
                  variant={isCurrentSnapshotIndexed ? 'light' : 'filled'}
                  color={isCurrentSnapshotIndexed ? 'teal' : undefined}
                  leftSection={<Database size={14} />}
                  loading={indexMutation.isPending || isIndexing}
                  disabled={latestSnapshotVersion === null || snapshotMutation.isPending || isIndexing}
                  onClick={handleTriggerIndex}
                >
                  {isCurrentSnapshotIndexed ? '知识库已更新' : '更新知识库'}
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

        {citationLocation?.snapshotVersion && citationLocation.blockId ? (
          <Container size={1040} px={{ base: 'md', md: 'lg' }} py="sm" w="100%">
            <Alert color="blue" title="已打开引用来源">
              {citationFocusState === 'located'
                ? `已定位并高亮快照 v${citationLocation.snapshotVersion} 对应的当前文档块。`
                : citationFocusState === 'not-found'
                  ? `引用来自快照 v${citationLocation.snapshotVersion} 的块 ${citationLocation.blockId}，但该块已变更或不存在。当前文档仍可正常查看和编辑。`
                  : `正在尝试定位快照 v${citationLocation.snapshotVersion} 的引用块...`}
            </Alert>
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
                <Badge size="sm" variant="light" color={isCurrentSnapshotIndexed ? 'teal' : 'gray'}>
                  {isCurrentSnapshotIndexed
                    ? `索引 v${latestIndexedVersion}`
                    : latestSnapshotVersion === null
                      ? '未创建快照'
                      : isIndexing
                        ? '索引进行中'
                        : `快照 v${latestSnapshotVersion} 待索引`}
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

              <Paper
                p="md"
                withBorder
                className="editor-surface rag-citation-scope"
                ref={editorSurfaceRef}
              >
                {citationFocusState === 'located' && citationLocation?.blockId ? (
                  <CitationHighlightStyle blockId={citationLocation.blockId} />
                ) : null}
                {isCollaborationEditor && collaborationRuntime ? (
                  <DocumentEditor
                    key={`${document.id}:collaboration`}
                    mode="collaboration"
                    editable={collaborationRuntime.payload.capabilities.canEdit}
                    ai={
                      collaborationRuntime.payload.capabilities.canEdit && collaborationStatus === 'connected'
                        ? { api: '/api/ai/editor', documentId: document.id, headers: getEditorAiHeaders }
                        : undefined
                    }
                    onChange={handleDocumentEditorChange}
                    onReady={handleLocateCitationBlock}
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
                ) : !isCollaborationUnavailable && collaborationStatus !== 'error' ? (
                  <Stack gap="sm">
                    <Skeleton h={18} radius="sm" w="30%" />
                    <Skeleton h={240} radius="md" />
                  </Stack>
                ) : (
                  <DocumentEditor
                    key={`${document.id}:standalone`}
                    editable
                    ai={{ api: '/api/ai/editor', documentId: document.id, headers: getEditorAiHeaders }}
                    initialContent={initialContent}
                    onChange={handleDocumentEditorChange}
                    onReady={handleLocateCitationBlock}
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
  // 与 Vite/API 的 localhost 开发地址保持一致，避免 IPv4 与 IPv6 loopback 混用导致握手失败。
  return import.meta.env.VITE_COLLAB_WS_URL ?? 'ws://localhost:3334'
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

function CitationHighlightStyle({ blockId }: { blockId: string }) {
  // BlockNote 官方 HTML 为每个 blockContainer 输出稳定 data-id；由路由状态生成选择器，
  // 能在协同编辑器重绘节点后继续指向同一个 Citation，而不是依赖一次性的 DOM mutation。
  const selector = `[data-node-type="blockContainer"][data-id="${escapeCssString(blockId)}"]`

  return (
    <style>{`
      .rag-citation-scope ${selector} {
        border-left: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }

      .rag-citation-scope ${selector} > .bn-block-content {
        background: #fff3bf !important;
        border-radius: 4px;
        box-shadow: inset 0 0 0 1px #fde68a;
      }

      .rag-citation-scope ${selector} .bn-inline-content {
        background: transparent !important;
      }

      [data-mantine-color-scheme="dark"] .rag-citation-scope ${selector} > .bn-block-content {
        background: rgba(217, 119, 6, 0.18) !important;
        box-shadow: inset 0 0 0 1px rgba(251, 191, 36, 0.28);
      }
    `}</style>
  )
}

function escapeCssString(value: string) {
  // 使用 code point escape，避免 URL 参数中的引号或反斜杠改变 style 标签内的选择器结构。
  return Array.from(value)
    .map((character) => `\\${character.codePointAt(0)?.toString(16)} `)
    .join('')
}
