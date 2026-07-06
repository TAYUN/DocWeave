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
import { AlertCircle, ArrowRight, FileText, FolderOpen, LayoutDashboard, Sparkles } from 'lucide-react'
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
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import {
  createDocument,
  createSpace,
  getDocumentById,
  listDocuments,
  listSpaces,
  listStages,
  updateDocument,
} from './lib/workspace-data'
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

function AppShell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const navigate = useNavigate()

  return (
    <div className="shell">
      <aside className="sidebar">
        <Paper className="sidebar-surface" p="xl" withBorder>
          <Stack gap="xl">
            <div>
              <Text className="eyebrow">DocWeave</Text>
              <Title className="sidebar-title" order={1}>
                Workspace cockpit
              </Title>
              <Text className="sidebar-copy" mt="md">
                React SPA, routing, and data orchestration are now wired for the phase-1 runtime.
                This shell is ready for TanStack Router, Query, and Mantine driven growth.
              </Text>
            </div>

            <Stack className="nav" gap="sm">
              <Button
                className="nav-button"
                justify="flex-start"
                leftSection={<LayoutDashboard size={18} />}
                onClick={() => navigate({ to: '/' })}
                variant={pathname === '/' ? 'filled' : 'light'}
              >
                Overview
              </Button>
              <Button
                className="nav-button"
                justify="flex-start"
                leftSection={<FileText size={18} />}
                onClick={() =>
                  navigate({ to: '/documents/$documentId', params: { documentId: 'doc-editor-runtime' } })
                }
                variant={pathname.includes('doc-editor-runtime') ? 'filled' : 'light'}
              >
                Editor runtime
              </Button>
              <Button
                className="nav-button"
                justify="flex-start"
                leftSection={<Sparkles size={18} />}
                onClick={() =>
                  navigate({ to: '/documents/$documentId', params: { documentId: 'doc-collab-token' } })
                }
                variant={pathname.includes('doc-collab-token') ? 'filled' : 'light'}
              >
                Collaboration token
              </Button>
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

function OverviewPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [spaceName, setSpaceName] = useState('')
  const [spaceSummary, setSpaceSummary] = useState('')
  const [error, setError] = useState<string | null>(null)
  const stagesQuery = useSuspenseQuery(queryOptions({ queryKey: ['stages'], queryFn: listStages }))
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
            <Text className="eyebrow">Phase 1</Text>
            <Title order={2} mt="xs">
              Monorepo runtime baseline is live
            </Title>
            <Text className="hero-copy" mt="md">
              The frontend now has route state, query orchestration, and a clearer landing
              surface for editor, collaboration, and AI milestones.
            </Text>
          </div>
          <Sparkles size={28} />
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
        {stagesQuery.data.map((stage) => (
          <Paper key={stage.id} className="panel stage-card" p="xl" withBorder>
            <Group justify="space-between" align="flex-start">
              <div>
                <Text className="panel-kicker">{stage.owner}</Text>
                <Title order={3} mt="xs">
                  {stage.name}
                </Title>
              </div>
              <Sparkles size={18} />
            </Group>
            <Text mt="md">{stage.summary}</Text>
          </Paper>
        ))}
      </SimpleGrid>

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
                Approved workspace domains
              </Title>
            </div>
            <Badge className="badge">
              {spacesQuery.data.length}
            </Badge>
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
                  <Badge>
                    {space.rootDocuments.length} docs
                  </Badge>
                </Group>
              </Paper>
            ))}
            {spacesQuery.data.length === 0 ? (
              <Paper className="stack-row empty-row" p="lg" withBorder>
                <Text fw={700}>No spaces yet</Text>
                <Text className="stack-support" mt={4} size="sm">
                  Run the PostgreSQL migrations and seed your first workspace records to populate this panel.
                </Text>
              </Paper>
            ) : null}
          </Stack>
        </Paper>

        <Paper className="panel" p="xl" withBorder>
          <Group className="panel-header" justify="space-between" align="flex-start">
            <div>
              <Text className="panel-kicker">Documents</Text>
              <Title order={3} mt="xs">
                Priority implementation threads
              </Title>
            </div>
            <Badge className="badge">
              {documentsQuery.data.length}
            </Badge>
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
                  <Badge style={{ textTransform: 'capitalize' }}>
                    {document.status}
                  </Badge>
                </Group>
              </Paper>
            ))}
            {documentsQuery.data.length === 0 ? (
              <Paper className="stack-row empty-row" p="lg" withBorder>
                <Text fw={700}>No documents yet</Text>
                <Text className="stack-support" mt={4} size="sm">
                  The API is wired. Next step is creating spaces and documents in PostgreSQL.
                </Text>
              </Paper>
            ) : null}
          </Stack>
        </Paper>
      </SimpleGrid>
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
          This route is ready, but the requested space does not exist in the current seed data.
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
          <Badge className="badge">
            {documents.length}
          </Badge>
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
                  <Badge style={{ textTransform: 'capitalize' }}>
                    {document.status}
                  </Badge>
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

  if (!document) {
    return (
      <Paper className="panel" p="xl" withBorder>
        <Text className="eyebrow">Missing document</Text>
        <Title order={2} mt="xs">
          Route found, document not seeded
        </Title>
        <Text className="hero-copy" mt="md">
          This path is ready, but the scaffold dataset does not include the requested document yet.
        </Text>
      </Paper>
    )
  }

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
            Seeded status
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
            This page now loads a real BlockNote editor and persists the document body through the API boundary.
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
  component: AppShell,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: OverviewPage,
})

const documentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/documents/$documentId',
  component: DocumentPage,
})

const spaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/spaces/$spaceId',
  component: SpacePage,
})

const routeTree = rootRoute.addChildren([indexRoute, spaceRoute, documentRoute])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
