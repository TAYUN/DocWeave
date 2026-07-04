import {
  Link,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  useRouterState,
} from '@tanstack/react-router'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import {
  getDocumentById,
  listDocuments,
  listSpaces,
  listStages,
} from './lib/workspace-data'
import './App.css'

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
  const stagesQuery = useSuspenseQuery(queryOptions({ queryKey: ['stages'], queryFn: listStages }))
  const spacesQuery = useSuspenseQuery(queryOptions({ queryKey: ['spaces'], queryFn: listSpaces }))
  const documentsQuery = useSuspenseQuery(
    queryOptions({ queryKey: ['documents'], queryFn: listDocuments }),
  )

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
              <p className="panel-kicker">Spaces</p>
              <h3>Approved workspace domains</h3>
            </div>
            <span className="badge">{spacesQuery.data.length}</span>
          </div>
          <ul className="stack-list">
            {spacesQuery.data.map((space) => (
              <li key={space.id} className="stack-row">
                <div>
                  <strong>{space.name}</strong>
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

function DocumentPage() {
  const { documentId } = documentRoute.useParams()
  const documentQuery = useSuspenseQuery(
    queryOptions({
      queryKey: ['document', documentId],
      queryFn: () => getDocumentById(documentId),
    }),
  )

  const document = documentQuery.data

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
        <h2>{document.title}</h2>
        <p className="hero-copy">{document.summary}</p>
      </section>

      <section className="grid split">
        <article className="panel">
          <p className="panel-kicker">Delivery notes</p>
          <h3>Why this route matters</h3>
          <p>
            This document route demonstrates parameterized navigation and query-driven
            data loading, which is the foundation for future workspace, document, and editor pages.
          </p>
        </article>

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
        </article>
      </section>
    </div>
  )
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

const routeTree = rootRoute.addChildren([indexRoute, documentRoute])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
