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
      <Text className="eyebrow">Loading</Text>
      <Title order={2} mt="xs">
        {label}
      </Title>
      <Text className="hero-copy" mt="md">
        The workbench is syncing the current product state.
      </Text>
    </Paper>
  )
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
        message: 'The workbench is ready.',
        title: 'Sign in',
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['current-user'] }),
        queryClient.invalidateQueries({ queryKey: ['spaces'] }),
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
      ])
      navigate({ to: '/' })
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to sign in')
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
              Sign in to the real workbench
            </Title>
            <Text className="hero-copy" mt="md">
              This entry now gates the actual space tree and document editing flow instead of
              dropping into the old demo shell.
            </Text>
          </div>

          <Paper className="hint-card" p="lg" withBorder>
            <Text fw={700}>Development account</Text>
            <Text className="stack-support" mt={6} size="sm">
              Email: <code>owner@docweave.dev</code>
            </Text>
            <Text className="stack-support" size="sm">
              Password: <code>docweave123</code>
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
              label="Email"
              onChange={(event) => setEmail(event.currentTarget.value)}
              required
              type="email"
              value={email}
            />
            <TextInput
              label="Password"
              onChange={(event) => setPassword(event.currentTarget.value)}
              required
              type="password"
              value={password}
            />
            <Button loading={loginMutation.isPending} type="submit">
              {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
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
        message: 'You have exited the workbench.',
        title: 'Signed out',
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
    return <LoadingState label="Redirecting to sign in" />
  }

  if (currentUserQuery.isPending || spacesQuery.isPending) {
    return <LoadingState label="Loading the workbench shell" />
  }

  if (currentUserQuery.isError || spacesQuery.isError || !currentUserQuery.data) {
    return (
      <Paper className="panel" p="xl" withBorder>
        <Text className="eyebrow">Workbench blocked</Text>
        <Title order={2} mt="xs">
          Unable to load the signed-in shell
        </Title>
        <Text className="hero-copy" mt="md">
          {(firstAuthError as Error | null)?.message ?? 'The current user context could not be resolved.'}
        </Text>
        <Button mt="lg" onClick={() => currentUserQuery.refetch()}>
          Retry
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
                Product workbench
              </Title>
              <Text className="sidebar-copy" mt="md">
                The shell now reflects the real M2 chain: signed-in user, real space tree, and
                protected document entrypoints.
              </Text>
            </div>

            <Paper className="user-card" p="lg" withBorder>
              <Group justify="space-between" align="flex-start">
                <div>
                  <Text className="status-label">Current user</Text>
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
                Sign out
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
                Workbench
              </Button>
            </Stack>

            <Stack className="tree-list" gap="sm">
              <Text className="status-label">Space tree</Text>
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
                        Loading space tree...
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
                        No documents in this space yet.
                      </Text>
                    )}
                  </Stack>
                </Paper>
              ))}
              {treeEntries.length === 0 ? (
                <Paper className="tree-space" p="md" withBorder>
                  <Text fw={700}>No spaces yet</Text>
                  <Text className="stack-support" mt={6} size="sm">
                    Create a space from the workbench home to start the M2 flow.
                  </Text>
                </Paper>
              ) : null}
            </Stack>

            <Paper className="status-card" p="lg" withBorder>
              <Text className="status-label">Current route</Text>
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
        message: 'Space created successfully.',
        title: 'Create space',
      })
      await queryClient.invalidateQueries({ queryKey: ['spaces'] })
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to create space')
    },
  })

  return (
    <Stack className="page" gap="xl">
      <Paper className="hero-panel" p="xl" withBorder>
        <Group justify="space-between" align="flex-start" gap="xl">
          <div>
            <Text className="eyebrow">Workbench</Text>
            <Title order={2} mt="xs">
              Enter a real space before opening documents
            </Title>
            <Text className="hero-copy" mt="md">
              The old demo shortcuts are gone. Use the authenticated shell and real space tree to
              move from workspace entry to document editing.
            </Text>
          </div>
          <LayoutDashboard size={28} />
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="lg">
        <Paper className="panel" p="xl" withBorder>
          <Group className="panel-header" justify="space-between" align="flex-start">
            <div>
              <Text className="panel-kicker">Create space</Text>
              <Title order={3} mt="xs">
                Open a new workspace domain
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
              label="Name"
              onChange={(event) => setSpaceName(event.currentTarget.value)}
              placeholder="Research Workspace"
              required
              value={spaceName}
            />
            <Textarea
              autosize
              label="Summary"
              minRows={3}
              onChange={(event) => setSpaceSummary(event.currentTarget.value)}
              placeholder="Track experiments, findings, and next actions."
              required
              value={spaceSummary}
            />
            <Button loading={createSpaceMutation.isPending} type="submit">
              {createSpaceMutation.isPending ? 'Creating...' : 'Create space'}
            </Button>
            <MutationNotice message={error} />
          </Stack>
        </Paper>

        <Paper className="panel" p="xl" withBorder>
          <Group className="panel-header" justify="space-between" align="flex-start">
            <div>
              <Text className="panel-kicker">Spaces</Text>
              <Title order={3} mt="xs">
                Active workbench domains
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
                  <Badge>{space.rootDocuments.length} docs</Badge>
                </Group>
              </Paper>
            ))}
            {spacesQuery.data.length === 0 ? (
              <Paper className="stack-row empty-row" p="lg" withBorder>
                <Text fw={700}>No spaces yet</Text>
                <Text className="stack-support" mt={4} size="sm">
                  Create a space to unlock the next step in the M2 flow.
                </Text>
              </Paper>
            ) : null}
          </Stack>
        </Paper>
      </SimpleGrid>

      <Paper className="panel" p="xl" withBorder>
        <Group className="panel-header" justify="space-between" align="flex-start">
          <div>
            <Text className="panel-kicker">Documents</Text>
            <Title order={3} mt="xs">
              Recent product threads
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
                <Badge style={{ textTransform: 'capitalize' }}>{document.status}</Badge>
              </Group>
            </Paper>
          ))}
          {documentsQuery.data.length === 0 ? (
            <Paper className="stack-row empty-row" p="lg" withBorder>
              <Text fw={700}>No documents yet</Text>
              <Text className="stack-support" mt={4} size="sm">
                Enter a space and create a document to continue the M2 chain.
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
        message: 'Document created successfully.',
        title: 'Create document',
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
        queryClient.invalidateQueries({ queryKey: ['spaces'] }),
        queryClient.invalidateQueries({ queryKey: ['space-tree', spaceId] }),
      ])
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to create document')
    },
  })

  const space = spacesQuery.data.find((entry) => entry.id === spaceId) ?? null
  const documents = documentsQuery.data.filter((entry) => entry.spaceId === spaceId)

  if (!space) {
    return (
      <Paper className="panel" p="xl" withBorder>
        <Text className="eyebrow">Missing space</Text>
        <Title order={2} mt="xs">
          Workspace not found
        </Title>
        <Text className="hero-copy" mt="md">
          The requested space does not exist in the current database.
        </Text>
      </Paper>
    )
  }

  return (
    <Stack className="page" gap="xl">
      <Paper className="hero-panel compact" p="xl" withBorder>
        <Group justify="space-between" align="flex-start" gap="xl">
          <div>
            <Text className="eyebrow">Space</Text>
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
            <Text className="panel-kicker">Create document</Text>
            <Title order={3} mt="xs">
              Seed a document in this space
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
            label="Title"
            onChange={(event) => setTitle(event.currentTarget.value)}
            placeholder="New document"
            required
            value={title}
          />
          <Textarea
            autosize
            label="Summary"
            minRows={3}
            onChange={(event) => setSummary(event.currentTarget.value)}
            placeholder="Describe the intent of this document."
            required
            value={summary}
          />
          <Button loading={createDocumentMutation.isPending} type="submit">
            {createDocumentMutation.isPending ? 'Creating...' : 'Create document'}
          </Button>
          <MutationNotice message={error} />
        </Stack>
      </Paper>

      <Paper className="panel" p="xl" withBorder>
        <Group className="panel-header" justify="space-between" align="flex-start">
          <div>
            <Text className="panel-kicker">Documents</Text>
            <Title order={3} mt="xs">
              Documents in this workspace
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
                  <Badge style={{ textTransform: 'capitalize' }}>{document.status}</Badge>
                  <ArrowRight size={16} />
                </Group>
              </Group>
            </Paper>
          ))}
          {documents.length === 0 ? (
            <Paper className="stack-row empty-row" p="lg" withBorder>
              <Text fw={700}>No documents yet</Text>
              <Text className="stack-support" mt={4} size="sm">
                This space exists, but it does not have any documents in the current database.
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
        message: 'Document saved.',
        title: 'Save document',
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['document', documentId] }),
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
        queryClient.invalidateQueries({ queryKey: ['spaces'] }),
        queryClient.invalidateQueries({ queryKey: ['space-tree', updated.spaceId] }),
      ])
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to update document')
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
            <Text className="eyebrow">{document.status}</Text>
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
              <Text className="panel-kicker">Document</Text>
              <Title order={3} mt="xs">
                Edit title, summary, and body
              </Title>
            </div>
            <LayoutDashboard size={18} />
          </Group>

          <Stack className="form-stack" gap="md" mt="lg">
            <TextInput
              label="Title"
              onChange={(event) => setTitle(event.currentTarget.value)}
              required
              value={title}
            />
            <Textarea
              autosize
              label="Summary"
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
              {updateDocumentMutation.isPending ? 'Saving...' : 'Save document'}
            </Button>
            <MutationNotice message={error} />
          </Stack>
        </Paper>

        <Paper className="panel metadata-card" p="xl" withBorder>
          <Text className="panel-kicker">Metadata</Text>
          <Title order={3} mt="xs">
            Current document context
          </Title>
          <Stack className="details" gap="md" mt="lg">
            <Paper className="detail-row" p="md" withBorder>
              <Text fw={700}>Document ID</Text>
              <Text className="stack-support" mt={4} size="sm">
                {document.id}
              </Text>
            </Paper>
            <Paper className="detail-row" p="md" withBorder>
              <Text fw={700}>Space</Text>
              <Text className="stack-support" mt={4} size="sm">
                {document.spaceId}
              </Text>
            </Paper>
            <Paper className="detail-row" p="md" withBorder>
              <Text fw={700}>Updated</Text>
              <Text className="stack-support" mt={4} size="sm">
                {document.updatedAt}
              </Text>
            </Paper>
          </Stack>
          <Text className="sidebar-copy" mt="lg">
            This document is now being entered through the real authenticated workbench path.
          </Text>
        </Paper>
      </SimpleGrid>
    </Stack>
  )
}

const defaultDocumentContent: DocumentEditorContent = [
  {
    type: 'paragraph',
    content: 'Start writing your document here.',
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
