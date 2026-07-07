import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  AlertCircle,
  ArrowRight,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  UserRound,
} from 'lucide-react'
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import {
  queryOptions,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import {
  createDocument,
  createSpace,
  getCurrentUser,
  getDocumentById,
  getSpaceTree,
  listDocuments,
  listSpaces,
  login,
  logout,
  updateDocument,
} from './lib/workspace-data'
import { isAuthError } from './lib/api'
import { clearAccessToken, hasAccessToken, readAuthSession, saveAccessToken } from './lib/auth'
import { DocumentEditor, type DocumentEditorContent } from '@docweave/editor'
import './App.css'

function MutationNotice({ message }: { message: string | null }) {
  if (!message) {
    return null
  }

  return (
    <Alert
      className="notice-inline"
      color="red"
      icon={<AlertCircle size={18} />}
      variant="light"
    >
      {message}
    </Alert>
  )
}

function LoadingState({ label }: { label: string }) {
  return (
    <Paper className="panel loading-panel" p="xl" withBorder>
      <Text className="eyebrow">加载中</Text>
      <Title order={2} mt="xs">
        {label}
      </Title>
      <Text className="hero-copy" mt="md">
        工作台正在同步当前的产品数据，请稍候。
      </Text>
    </Paper>
  )
}

function getDocumentStatusLabel(status: string) {
  // 页面层统一把后端状态值映射成中文，避免接口英文枚举直接暴露给用户。
  switch (status) {
    case 'draft':
      return '草稿'
    case 'published':
      return '已发布'
    case 'archived':
      return '已归档'
    default:
      return status
  }
}

function RootLayout() {
  return <Outlet />
}

function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('owner@docweave.dev')
  const [password, setPassword] = useState('docweave123')
  const [error, setError] = useState<string | null>(null)
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async (payload) => {
      saveAccessToken(payload.token)
      setError(null)
      notifications.show({
        color: 'green',
        message: '工作台已就绪。',
        title: '登录成功',
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['current-user'] }),
        queryClient.invalidateQueries({ queryKey: ['spaces'] }),
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
      ])
      navigate({ to: '/' })
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : '登录失败，请稍后重试')
    },
  })

  useEffect(() => {
    if (hasAccessToken()) {
      navigate({ to: '/' })
    }
  }, [navigate])

  return (
    <div className="login-shell">
      <Paper className="login-panel" p="xl" withBorder>
        <Stack gap="xl">
          <div>
            <Text className="eyebrow">DocWeave M2</Text>
            <Title order={1} mt="xs">
              登录真实工作台
            </Title>
            <Text className="hero-copy" mt="md">
              这里现在接入了真实的空间树和文档编辑链路，不再进入旧的演示壳层。
            </Text>
          </div>

          <Paper className="hint-card" p="lg" withBorder>
            <Text fw={700}>开发账号</Text>
            <Text className="stack-support" mt={6} size="sm">
              邮箱：<code>owner@docweave.dev</code>
            </Text>
            <Text className="stack-support" size="sm">
              密码：<code>docweave123</code>
            </Text>
          </Paper>

          <Stack
            component="form"
            className="form-stack"
            gap="md"
            onSubmit={(event) => {
              event.preventDefault()
              setError(null)
              loginMutation.mutate({
                email,
                password,
              })
            }}
          >
            <TextInput
              label="邮箱"
              onChange={(event) => setEmail(event.currentTarget.value)}
              required
              type="email"
              value={email}
            />
            <TextInput
              label="密码"
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
              type="password"
              value={password}
            />
            <Button loading={loginMutation.isPending} type="submit">
              {loginMutation.isPending ? '登录中...' : '登录'}
            </Button>
            <MutationNotice message={error} />
          </Stack>
        </Stack>
      </Paper>
    </div>
  )
}

function WorkbenchShell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUserQuery = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    enabled: readAuthSession().token !== null,
    retry: false,
  })
  const spacesQuery = useQuery({
    queryKey: ['spaces'],
    queryFn: listSpaces,
    enabled: currentUserQuery.isSuccess,
    retry: false,
  })
  const treeQueries = useQueries({
    queries: (spacesQuery.data ?? []).map((space) => ({
      queryKey: ['space-tree', space.id],
      queryFn: () => getSpaceTree(space.id),
      enabled: currentUserQuery.isSuccess,
      retry: false,
    })),
  })
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: async () => {
      clearAccessToken()
      queryClient.clear()
      notifications.show({
        color: 'blue',
        message: '你已退出工作台。',
        title: '已退出登录',
      })
      await navigate({ to: '/login' })
    },
  })

  const firstAuthError =
    currentUserQuery.error ??
    spacesQuery.error ??
    treeQueries.find((query) => query.error instanceof Error)?.error ??
    null

  useEffect(() => {
    if (!hasAccessToken()) {
      void navigate({ to: '/login' })
    }
  }, [navigate])

  useEffect(() => {
    if (firstAuthError && isAuthError(firstAuthError)) {
      clearAccessToken()
      queryClient.clear()
      void navigate({ to: '/login' })
    }
  }, [firstAuthError, navigate, queryClient])

  if (!hasAccessToken()) {
    return <LoadingState label="正在跳转到登录页" />
  }

  if (currentUserQuery.isPending || spacesQuery.isPending) {
    return <LoadingState label="正在加载工作台" />
  }

  if (currentUserQuery.isError || spacesQuery.isError || !currentUserQuery.data) {
    return (
      <Paper className="panel" p="xl" withBorder>
        <Text className="eyebrow">工作台异常</Text>
        <Title order={2} mt="xs">
          无法加载已登录的工作台
        </Title>
        <Text className="hero-copy" mt="md">
          {(firstAuthError as Error | null)?.message ?? '当前用户上下文解析失败。'}
        </Text>
        <Button mt="lg" onClick={() => currentUserQuery.refetch()}>
          重试
        </Button>
      </Paper>
    )
  }

  const user = currentUserQuery.data
  const spaces = spacesQuery.data ?? []
  const treeEntries = spaces.map((space, index) => ({
    space,
    tree: treeQueries[index]?.data ?? null,
    isPending: treeQueries[index]?.isPending ?? false,
  }))

  return (
    <div className="shell">
      <aside className="sidebar">
        <Paper className="sidebar-surface" p="xl" withBorder>
          <Stack gap="xl">
            <div>
              <Text className="eyebrow">DocWeave</Text>
              <Title className="sidebar-title" order={1}>
                产品工作台
              </Title>
              <Text className="sidebar-copy" mt="md">
                这里展示的是真实的 M2 链路：已登录用户、真实空间树，以及受保护的文档入口。
              </Text>
            </div>

            <Paper className="user-card" p="lg" withBorder>
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text className="status-label">当前用户</Text>
                  <Text className="status-value" fw={700} mt={6}>
                    {user.fullName ?? user.email}
                  </Text>
                  <Text className="stack-support" mt={4} size="sm">
                    {user.email}
                  </Text>
                </div>
                <UserRound size={20} />
              </Group>
              <Button
                className="logout-button"
                color="gray"
                fullWidth
                leftSection={<LogOut size={16} />}
                loading={logoutMutation.isPending}
                mt="md"
                onClick={() => logoutMutation.mutate()}
                variant="light"
              >
                退出登录
              </Button>
            </Paper>

            <Stack className="nav" gap="sm">
              <Button
                className="nav-button"
                justify="flex-start"
                leftSection={<LayoutDashboard size={18} />}
                onClick={() => navigate({ to: '/' })}
                variant={pathname === '/' ? 'filled' : 'light'}
              >
                工作台
              </Button>
            </Stack>

            <Stack className="tree-list" gap="sm">
              <Text className="status-label">空间树</Text>
              {treeEntries.map(({ space, tree, isPending }) => (
                <Paper key={space.id} className="tree-space" p="md" withBorder>
                  <Button
                    className="tree-button"
                    justify="space-between"
                    leftSection={<FolderOpen size={16} />}
                    onClick={() => navigate({ to: '/spaces/$spaceId', params: { spaceId: space.id } })}
                    variant={pathname.includes(`/spaces/${space.id}`) ? 'filled' : 'subtle'}
                  >
                    {space.name}
                  </Button>
                  <Text className="stack-support" mt={8} size="sm">
                    {space.summary}
                  </Text>
                  <Stack gap={6} mt="md">
                    {isPending ? (
                      <Text className="stack-support" size="sm">
                        正在加载空间树...
                      </Text>
                    ) : tree && tree.children.length > 0 ? (
                      tree.children.map((document) => (
                        <Button
                          key={document.id}
                          className="tree-doc-button"
                          justify="space-between"
                          leftSection={<FileText size={14} />}
                          onClick={() =>
                            navigate({
                              to: '/documents/$documentId',
                              params: { documentId: document.id },
                            })
                          }
                          variant={pathname.includes(`/documents/${document.id}`) ? 'filled' : 'light'}
                        >
                          {document.title}
                        </Button>
                      ))
                    ) : (
                      <Text className="stack-support" size="sm">
                        这个空间里还没有文档。
                      </Text>
                    )}
                  </Stack>
                </Paper>
              ))}
              {treeEntries.length === 0 ? (
                <Paper className="tree-space" p="md" withBorder>
                  <Text fw={700}>还没有空间</Text>
                  <Text className="stack-support" mt={6} size="sm">
                    先在工作台首页创建一个空间，再开始 M2 流程。
                  </Text>
                </Paper>
              ) : null}
            </Stack>

            <Paper className="status-card" p="lg" withBorder>
              <Text className="status-label">当前路由</Text>
              <Text className="status-value" fw={700} mt={6}>
                {pathname}
              </Text>
            </Paper>
          </Stack>
        </Paper>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}

function WorkbenchHome() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [spaceName, setSpaceName] = useState('')
  const [spaceSummary, setSpaceSummary] = useState('')
  const [error, setError] = useState<string | null>(null)
  const spacesQuery = useSuspenseQuery(queryOptions({ queryKey: ['spaces'], queryFn: listSpaces }))
  const documentsQuery = useSuspenseQuery(
    queryOptions({ queryKey: ['documents'], queryFn: listDocuments }),
  )
  const createSpaceMutation = useMutation({
    mutationFn: createSpace,
    onSuccess: async () => {
      setSpaceName('')
      setSpaceSummary('')
      setError(null)
      notifications.show({
        color: 'green',
        message: '空间创建成功。',
        title: '创建空间',
      })
      await queryClient.invalidateQueries({ queryKey: ['spaces'] })
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : '创建空间失败，请稍后重试')
    },
  })

  return (
    <Stack className="page" gap="xl">
      <Paper className="hero-panel" p="xl" withBorder>
        <Group justify="space-between" align="flex-start" gap="xl">
          <div>
            <Text className="eyebrow">工作台</Text>
            <Title order={2} mt="xs">
              先进入真实空间，再打开文档
            </Title>
            <Text className="hero-copy" mt="md">
              旧的演示快捷入口已经移除。请通过已认证的工作台和真实空间树进入文档编辑流程。
            </Text>
          </div>
          <LayoutDashboard size={28} />
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg">
        <Paper className="panel" p="xl" withBorder>
          <Group className="panel-header" justify="space-between" align="flex-start">
            <div>
              <Text className="panel-kicker">创建空间</Text>
              <Title order={3} mt="xs">
                新建一个工作空间
              </Title>
            </div>
            <FolderOpen size={18} />
          </Group>
          <Stack
            component="form"
            className="form-stack"
            gap="md"
            mt="lg"
            onSubmit={(event) => {
              event.preventDefault()
              setError(null)
              createSpaceMutation.mutate({
                name: spaceName,
                summary: spaceSummary,
              })
            }}
          >
            <TextInput
              label="名称"
              onChange={(event) => setSpaceName(event.currentTarget.value)}
              placeholder="例如：研究工作区"
              required
              value={spaceName}
            />
            <Textarea
              autosize
              label="简介"
              minRows={3}
              onChange={(event) => setSpaceSummary(event.currentTarget.value)}
              placeholder="填写这个空间的用途、阶段目标和后续动作。"
              required
              value={spaceSummary}
            />
            <Button loading={createSpaceMutation.isPending} type="submit">
              {createSpaceMutation.isPending ? '创建中...' : '创建空间'}
            </Button>
            <MutationNotice message={error} />
          </Stack>
        </Paper>

        <Paper className="panel" p="xl" withBorder>
          <Group className="panel-header" justify="space-between" align="flex-start">
            <div>
              <Text className="panel-kicker">空间</Text>
              <Title order={3} mt="xs">
                当前可用的工作空间
              </Title>
            </div>
            <Badge className="badge">{spacesQuery.data.length}</Badge>
          </Group>
          <Stack className="stack-list" gap="md" mt="lg">
            {spacesQuery.data.map((space) => (
              <Paper
                component="button"
                key={space.id}
                className="stack-row"
                p="md"
                withBorder
                onClick={() => navigate({ to: '/spaces/$spaceId', params: { spaceId: space.id } })}
              >
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <div>
                    <Text fw={700}>{space.name}</Text>
                    <Text className="stack-support" mt={4} size="sm">
                      {space.summary}
                    </Text>
                  </div>
                  <Badge>{space.rootDocuments.length} 篇文档</Badge>
                </Group>
              </Paper>
            ))}
            {spacesQuery.data.length === 0 ? (
              <Paper className="stack-row empty-row" p="lg" withBorder>
                <Text fw={700}>还没有空间</Text>
                <Text className="stack-support" mt={4} size="sm">
                  创建一个空间后，才能继续下一步 M2 流程。
                </Text>
              </Paper>
            ) : null}
          </Stack>
        </Paper>
      </SimpleGrid>

      <Paper className="panel" p="xl" withBorder>
        <Group className="panel-header" justify="space-between" align="flex-start">
          <div>
            <Text className="panel-kicker">文档</Text>
            <Title order={3} mt="xs">
              最近的产品文档
            </Title>
          </div>
          <Badge className="badge">{documentsQuery.data.length}</Badge>
        </Group>
        <Stack className="stack-list" gap="md" mt="lg">
          {documentsQuery.data.map((document) => (
            <Paper
              component="button"
              key={document.id}
              className="stack-row"
              p="md"
              withBorder
              onClick={() =>
                navigate({ to: '/documents/$documentId', params: { documentId: document.id } })
              }
            >
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <div>
                  <Text fw={700}>{document.title}</Text>
                  <Text className="stack-support" mt={4} size="sm">
                    {document.summary}
                  </Text>
                </div>
                <Badge>{getDocumentStatusLabel(document.status)}</Badge>
              </Group>
            </Paper>
          ))}
          {documentsQuery.data.length === 0 ? (
            <Paper className="stack-row empty-row" p="lg" withBorder>
              <Text fw={700}>还没有文档</Text>
              <Text className="stack-support" mt={4} size="sm">
                进入一个空间并创建文档后，才能继续 M2 链路。
              </Text>
            </Paper>
          ) : null}
        </Stack>
      </Paper>
    </Stack>
  )
}

function SpacePage() {
  const { spaceId } = spaceRoute.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [error, setError] = useState<string | null>(null)
  const spacesQuery = useSuspenseQuery(queryOptions({ queryKey: ['spaces'], queryFn: listSpaces }))
  const documentsQuery = useSuspenseQuery(
    queryOptions({ queryKey: ['documents'], queryFn: listDocuments }),
  )
  const createDocumentMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: async () => {
      setTitle('')
      setSummary('')
      setError(null)
      notifications.show({
        color: 'green',
        message: '文档创建成功。',
        title: '创建文档',
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
        queryClient.invalidateQueries({ queryKey: ['spaces'] }),
        queryClient.invalidateQueries({ queryKey: ['space-tree', spaceId] }),
      ])
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : '创建文档失败，请稍后重试')
    },
  })

  const space = spacesQuery.data.find((entry) => entry.id === spaceId) ?? null
  const documents = documentsQuery.data.filter((entry) => entry.spaceId === spaceId)

  if (!space) {
    return (
      <Paper className="panel" p="xl" withBorder>
        <Text className="eyebrow">空间缺失</Text>
        <Title order={2} mt="xs">
          未找到对应空间
        </Title>
        <Text className="hero-copy" mt="md">
          当前数据库中不存在你访问的这个空间。
        </Text>
      </Paper>
    )
  }

  return (
    <Stack className="page" gap="xl">
      <Paper className="hero-panel compact" p="xl" withBorder>
        <Group justify="space-between" align="flex-start" gap="xl">
          <div>
            <Text className="eyebrow">空间</Text>
            <Title order={2} mt="xs">
              {space.name}
            </Title>
            <Text className="hero-copy" mt="md">
              {space.summary}
            </Text>
          </div>
          <FolderOpen size={28} />
        </Group>
      </Paper>

      <Paper className="panel" p="xl" withBorder>
        <Group className="panel-header" justify="space-between" align="flex-start">
          <div>
            <Text className="panel-kicker">创建文档</Text>
            <Title order={3} mt="xs">
              在这个空间中新增文档
            </Title>
          </div>
          <FileText size={18} />
        </Group>
        <Stack
          component="form"
          className="form-stack"
          gap="md"
          mt="lg"
          onSubmit={(event) => {
            event.preventDefault()
            setError(null)
            createDocumentMutation.mutate({
              spaceId,
              title,
              summary,
            })
          }}
        >
          <TextInput
            label="标题"
            onChange={(event) => setTitle(event.currentTarget.value)}
            placeholder="例如：新的产品文档"
            required
            value={title}
          />
          <Textarea
            autosize
            label="摘要"
            minRows={3}
            onChange={(event) => setSummary(event.currentTarget.value)}
            placeholder="简要说明这篇文档的目标和内容。"
            required
            value={summary}
          />
          <Button loading={createDocumentMutation.isPending} type="submit">
            {createDocumentMutation.isPending ? '创建中...' : '创建文档'}
          </Button>
          <MutationNotice message={error} />
        </Stack>
      </Paper>

      <Paper className="panel" p="xl" withBorder>
        <Group className="panel-header" justify="space-between" align="flex-start">
          <div>
            <Text className="panel-kicker">文档</Text>
            <Title order={3} mt="xs">
              这个空间下的文档
            </Title>
          </div>
          <Badge className="badge">{documents.length}</Badge>
        </Group>
        <Stack className="stack-list" gap="md" mt="lg">
          {documents.map((document) => (
            <Paper
              component="button"
              key={document.id}
              className="stack-row"
              p="md"
              withBorder
              onClick={() =>
                navigate({ to: '/documents/$documentId', params: { documentId: document.id } })
              }
            >
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <div>
                  <Text fw={700}>{document.title}</Text>
                  <Text className="stack-support" mt={4} size="sm">
                    {document.summary}
                  </Text>
                </div>
                <Group gap="sm" wrap="nowrap">
                  <Badge>{getDocumentStatusLabel(document.status)}</Badge>
                  <ArrowRight size={16} />
                </Group>
              </Group>
            </Paper>
          ))}
          {documents.length === 0 ? (
            <Paper className="stack-row empty-row" p="lg" withBorder>
              <Text fw={700}>还没有文档</Text>
              <Text className="stack-support" mt={4} size="sm">
                这个空间已经创建，但当前数据库里还没有任何文档。
              </Text>
            </Paper>
          ) : null}
        </Stack>
      </Paper>
    </Stack>
  )
}

function DocumentPage() {
  const { documentId } = documentRoute.useParams()
  const queryClient = useQueryClient()
  const documentQuery = useSuspenseQuery(
    queryOptions({
      queryKey: ['document', documentId],
      queryFn: () => getDocumentById(documentId),
    }),
  )
  const document = documentQuery.data
  const [title, setTitle] = useState(() => document.title)
  const [summary, setSummary] = useState(() => document.summary)
  // 在编辑器外保留一份草稿内容，保证标题、摘要与正文可以沿同一次保存动作一起提交。
  const [draftContent, setDraftContent] = useState<DocumentEditorContent>(() =>
    parseDocumentContent(document.content),
  )
  const [error, setError] = useState<string | null>(null)
  const updateDocumentMutation = useMutation({
    mutationFn: updateDocument,
    onSuccess: async (updated: Awaited<ReturnType<typeof updateDocument>>) => {
      setTitle(updated.title)
      setSummary(updated.summary)
      setDraftContent(parseDocumentContent(updated.content))
      setError(null)
      notifications.show({
        color: 'green',
        message: '文档已保存。',
        title: '保存文档',
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['document', documentId] }),
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
        queryClient.invalidateQueries({ queryKey: ['spaces'] }),
        queryClient.invalidateQueries({ queryKey: ['space-tree', updated.spaceId] }),
      ])
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : '保存文档失败，请稍后重试')
    },
  })

  const initialContent = useMemo(() => parseDocumentContent(document.content), [document.content])

  // 当路由切换到另一篇文档，或后端返回新的已保存版本时，重置本地表单状态避免旧草稿串文档。
  useEffect(() => {
    if (!document) {
      return
    }

    setTitle(document.title)
    setSummary(document.summary)
    setDraftContent(initialContent)
  }, [document, initialContent])

  return (
    <Stack className="page" gap="xl">
      <Paper className="hero-panel compact" p="xl" withBorder>
        <Group justify="space-between" align="flex-start" gap="xl">
          <div>
            <Text className="eyebrow">{getDocumentStatusLabel(document.status)}</Text>
            <Title order={2} mt="xs">
              {title || document.title}
            </Title>
            <Text className="hero-copy" mt="md">
              {summary || document.summary}
            </Text>
          </div>
          <FileText size={28} />
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg">
        <Paper
          className="panel editor-panel"
          component="form"
          p="xl"
          withBorder
          onSubmit={(event) => {
            event.preventDefault()
            setError(null)
            updateDocumentMutation.mutate({
              documentId,
              title,
              summary,
              content: JSON.stringify(draftContent),
            })
          }}
        >
          <Group className="panel-header" justify="space-between" align="flex-start">
            <div>
              <Text className="panel-kicker">文档</Text>
              <Title order={3} mt="xs">
                编辑标题、摘要和正文
              </Title>
            </div>
            <LayoutDashboard size={18} />
          </Group>

          <Stack className="form-stack" gap="md" mt="lg">
            <TextInput
              label="标题"
              onChange={(event) => setTitle(event.currentTarget.value)}
              required
              value={title}
            />
            <Textarea
              autosize
              label="摘要"
              minRows={4}
              onChange={(event) => setSummary(event.currentTarget.value)}
              required
              value={summary}
            />
            <Paper className="editor-frame" p="md" withBorder>
              <DocumentEditor
                key={document.id}
                initialContent={draftContent}
                onChange={setDraftContent}
              />
            </Paper>
            <Button loading={updateDocumentMutation.isPending} type="submit">
              {updateDocumentMutation.isPending ? '保存中...' : '保存文档'}
            </Button>
            <MutationNotice message={error} />
          </Stack>
        </Paper>

        <Paper className="panel metadata-card" p="xl" withBorder>
          <Text className="panel-kicker">元数据</Text>
          <Title order={3} mt="xs">
            当前文档上下文
          </Title>
          <Stack className="details" gap="md" mt="lg">
            <Paper className="detail-row" p="md" withBorder>
              <Text fw={700}>文档 ID</Text>
              <Text className="stack-support" mt={4} size="sm">
                {document.id}
              </Text>
            </Paper>
            <Paper className="detail-row" p="md" withBorder>
              <Text fw={700}>所属空间</Text>
              <Text className="stack-support" mt={4} size="sm">
                {document.spaceId}
              </Text>
            </Paper>
            <Paper className="detail-row" p="md" withBorder>
              <Text fw={700}>更新时间</Text>
              <Text className="stack-support" mt={4} size="sm">
                {document.updatedAt}
              </Text>
            </Paper>
          </Stack>
          <Text className="sidebar-copy" mt="lg">
            这篇文档现在通过真实的认证工作台链路进入和编辑。
          </Text>
        </Paper>
      </SimpleGrid>
    </Stack>
  )
}

const defaultDocumentContent: DocumentEditorContent = [
  {
    type: 'paragraph',
    content: '从这里开始编写你的文档。',
  },
]

function parseDocumentContent(rawContent: string): DocumentEditorContent {
  try {
    const parsed = JSON.parse(rawContent) as unknown

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as DocumentEditorContent
    }
  } catch {
    // 当持久化内容为空或结构损坏时，回退到最小段落，保证编辑器始终可进入可编辑态。
  }

  return defaultDocumentContent
}

const rootRoute = createRootRoute({
  component: RootLayout,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const workbenchLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'workbench',
  component: WorkbenchShell,
})

const indexRoute = createRoute({
  getParentRoute: () => workbenchLayoutRoute,
  path: '/',
  component: WorkbenchHome,
})

const documentRoute = createRoute({
  getParentRoute: () => workbenchLayoutRoute,
  path: '/documents/$documentId',
  component: DocumentPage,
})

const spaceRoute = createRoute({
  getParentRoute: () => workbenchLayoutRoute,
  path: '/spaces/$spaceId',
  component: SpacePage,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  workbenchLayoutRoute.addChildren([indexRoute, spaceRoute, documentRoute]),
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
