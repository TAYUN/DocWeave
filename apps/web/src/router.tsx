import { useEffect, useMemo, useState } from 'react'
import {
  Link,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
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

function MutationNotice({ message, tone }: { message: string | null; tone: 'error' | 'success' }) {
  if (!message) {
    return null
  }

  return <p className={`notice notice-${tone}`}>{message}</p>
}

function AppShell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <div className="shell">
      <aside className="sidebar">
        <p className="eyebrow">DocWeave</p>
        <h1>Workspace cockpit</h1>
        <p className="sidebar-copy">
          React SPA, routing, and data orchestration are now wired for the phase-1
          runtime. This shell is ready for TanStack Router and Query driven growth.
        </p>

        <nav className="nav">
          <Link className="nav-link" to="/">
            Overview
          </Link>
          <Link className="nav-link" to="/documents/$documentId" params={{ documentId: 'doc-editor-runtime' }}>
            Editor runtime
          </Link>
          <Link className="nav-link" to="/documents/$documentId" params={{ documentId: 'doc-collab-token' }}>
            Collaboration token
          </Link>
        </nav>

        <div className="status-card">
          <span className="status-label">Current route</span>
          <strong>{pathname}</strong>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}

function OverviewPage() {
  const queryClient = useQueryClient()
  const [spaceName, setSpaceName] = useState('')
  const [spaceSummary, setSpaceSummary] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
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
      setFeedback('Space created successfully.')
      await queryClient.invalidateQueries({ queryKey: ['spaces'] })
    },
    onError: (mutationError) => {
      setFeedback(null)
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to create space')
    },
  })

  return (
    <div className="page">
      <section className="hero-panel">
        <p className="eyebrow">Phase 1</p>
        <h2>Monorepo runtime baseline is live</h2>
        <p className="hero-copy">
          The frontend now has route state, query orchestration, and a clearer landing
          surface for editor, collaboration, and AI milestones.
        </p>
      </section>

      <section className="grid three-up">
        {stagesQuery.data.map((stage) => (
          <article key={stage.id} className="panel">
            <p className="panel-kicker">{stage.owner}</p>
            <h3>{stage.name}</h3>
            <p>{stage.summary}</p>
          </article>
        ))}
      </section>

      <section className="grid split">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Create space</p>
              <h3>Open a new workspace domain</h3>
            </div>
          </div>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault()
              setFeedback(null)
              setError(null)
              createSpaceMutation.mutate({
                name: spaceName,
                summary: spaceSummary,
              })
            }}
          >
            <label className="field">
              <span>Name</span>
              <input
                value={spaceName}
                onChange={(event) => setSpaceName(event.target.value)}
                placeholder="Research Workspace"
                required
              />
            </label>
            <label className="field">
              <span>Summary</span>
              <textarea
                value={spaceSummary}
                onChange={(event) => setSpaceSummary(event.target.value)}
                placeholder="Track experiments, findings, and next actions."
                required
                rows={3}
              />
            </label>
            <button className="action-button" type="submit" disabled={createSpaceMutation.isPending}>
              {createSpaceMutation.isPending ? 'Creating...' : 'Create space'}
            </button>
            <MutationNotice message={feedback} tone="success" />
            <MutationNotice message={error} tone="error" />
          </form>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Spaces</p>
              <h3>Approved workspace domains</h3>
            </div>
            <span className="badge">{spacesQuery.data.length}</span>
          </div>
          <ul className="stack-list">
            {spacesQuery.data.map((space) => (
              <li key={space.id} className="stack-row">
                <div>
                  <Link to="/spaces/$spaceId" params={{ spaceId: space.id }}>
                    {space.name}
                  </Link>
                  <p>{space.summary}</p>
                </div>
                <span>{space.rootDocuments.length} docs</span>
              </li>
            ))}
            {spacesQuery.data.length === 0 ? (
              <li className="stack-row empty-row">
                <div>
                  <strong>No spaces yet</strong>
                  <p>Run the PostgreSQL migrations and seed your first workspace records to populate this panel.</p>
                </div>
              </li>
            ) : null}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Documents</p>
              <h3>Priority implementation threads</h3>
            </div>
            <span className="badge">{documentsQuery.data.length}</span>
          </div>
          <ul className="stack-list">
            {documentsQuery.data.map((document) => (
              <li key={document.id} className="stack-row">
                <div>
                  <Link to="/documents/$documentId" params={{ documentId: document.id }}>
                    {document.title}
                  </Link>
                  <p>{document.summary}</p>
                </div>
                <span>{document.status}</span>
              </li>
            ))}
            {documentsQuery.data.length === 0 ? (
              <li className="stack-row empty-row">
                <div>
                  <strong>No documents yet</strong>
                  <p>The API is wired. Next step is creating spaces and documents in PostgreSQL.</p>
                </div>
              </li>
            ) : null}
          </ul>
        </article>
      </section>
    </div>
  )
}

function SpacePage() {
  const { spaceId } = spaceRoute.useParams()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
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
      setFeedback('Document created successfully.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
        queryClient.invalidateQueries({ queryKey: ['spaces'] }),
      ])
    },
    onError: (mutationError) => {
      setFeedback(null)
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to create document')
    },
  })

  const space = spacesQuery.data.find((entry) => entry.id === spaceId) ?? null
  const documents = documentsQuery.data.filter((entry) => entry.spaceId === spaceId)

  if (!space) {
    return (
      <section className="panel">
        <p className="eyebrow">Missing space</p>
        <h2>Workspace not found</h2>
        <p>This route is ready, but the requested space does not exist in the current seed data.</p>
      </section>
    )
  }

  return (
    <div className="page">
      <section className="hero-panel compact">
        <p className="eyebrow">Space</p>
        <h2>{space.name}</h2>
        <p className="hero-copy">{space.summary}</p>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-kicker">Create document</p>
            <h3>Seed a document in this space</h3>
          </div>
        </div>
        <form
          className="form-stack"
          onSubmit={(event) => {
            event.preventDefault()
            setFeedback(null)
            setError(null)
            createDocumentMutation.mutate({
              spaceId,
              title,
              summary,
            })
          }}
        >
          <label className="field">
            <span>Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="New document"
              required
            />
          </label>
          <label className="field">
            <span>Summary</span>
            <textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Describe the intent of this document."
              required
              rows={3}
            />
          </label>
          <button className="action-button" type="submit" disabled={createDocumentMutation.isPending}>
            {createDocumentMutation.isPending ? 'Creating...' : 'Create document'}
          </button>
          <MutationNotice message={feedback} tone="success" />
          <MutationNotice message={error} tone="error" />
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-kicker">Documents</p>
            <h3>Documents in this workspace</h3>
          </div>
          <span className="badge">{documents.length}</span>
        </div>
        <ul className="stack-list">
          {documents.map((document) => (
            <li key={document.id} className="stack-row">
              <div>
                <Link to="/documents/$documentId" params={{ documentId: document.id }}>
                  {document.title}
                </Link>
                <p>{document.summary}</p>
              </div>
              <span>{document.status}</span>
            </li>
          ))}
          {documents.length === 0 ? (
            <li className="stack-row empty-row">
              <div>
                <strong>No documents yet</strong>
                <p>This space exists, but it does not have any documents in the current database.</p>
              </div>
            </li>
          ) : null}
        </ul>
      </section>
    </div>
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
  const [draftContent, setDraftContent] = useState<DocumentEditorContent>(() =>
    parseDocumentContent(document.content),
  )
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const updateDocumentMutation = useMutation({
    mutationFn: updateDocument,
    onSuccess: async (updated: Awaited<ReturnType<typeof updateDocument>>) => {
      setTitle(updated.title)
      setSummary(updated.summary)
      setDraftContent(parseDocumentContent(updated.content))
      setError(null)
      setFeedback('Document saved.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['document', documentId] }),
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
        queryClient.invalidateQueries({ queryKey: ['spaces'] }),
      ])
    },
    onError: (mutationError) => {
      setFeedback(null)
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to update document')
    },
  })

  const initialContent = useMemo(() => parseDocumentContent(document.content), [document.content])

  // Reset local form state when a different document or persisted revision is loaded.
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
      <section className="panel">
        <p className="eyebrow">Missing document</p>
        <h2>Route found, document not seeded</h2>
        <p>This path is ready, but the scaffold dataset does not include the requested document yet.</p>
      </section>
    )
  }

  return (
    <div className="page">
      <section className="hero-panel compact">
        <p className="eyebrow">{document.status}</p>
        <h2>{title || document.title}</h2>
        <p className="hero-copy">{summary || document.summary}</p>
      </section>

      <section className="grid editor-layout">
        <form
          className="panel editor-panel"
          onSubmit={(event) => {
            event.preventDefault()
            setFeedback(null)
            setError(null)
            updateDocumentMutation.mutate({
              documentId,
              title,
              summary,
              content: JSON.stringify(draftContent),
            })
          }}
        >
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Document</p>
              <h3>Edit title, summary, and body</h3>
            </div>
          </div>

          <div className="form-stack">
            <label className="field">
              <span>Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>
            <label className="field">
              <span>Summary</span>
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                rows={4}
                required
              />
            </label>
            <div className="editor-frame">
              <DocumentEditor
                key={document.id}
                initialContent={draftContent}
                onChange={setDraftContent}
              />
            </div>
            <button className="action-button" type="submit" disabled={updateDocumentMutation.isPending}>
              {updateDocumentMutation.isPending ? 'Saving...' : 'Save document'}
            </button>
            <MutationNotice message={feedback} tone="success" />
            <MutationNotice message={error} tone="error" />
          </div>
        </form>

        <article className="panel">
          <p className="panel-kicker">Metadata</p>
          <h3>Seeded status</h3>
          <dl className="details">
            <div>
              <dt>Document ID</dt>
              <dd>{document.id}</dd>
            </div>
            <div>
              <dt>Space</dt>
              <dd>{document.spaceId}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{document.updatedAt}</dd>
            </div>
          </dl>
          <p className="sidebar-copy">
            This page now loads a real BlockNote editor and persists the document body through the API boundary.
          </p>
        </article>
      </section>
    </div>
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
    // Fall back to the seeded paragraph below when persisted content is missing or malformed.
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
