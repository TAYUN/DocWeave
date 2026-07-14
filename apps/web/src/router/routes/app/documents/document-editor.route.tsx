import { createRoute, type AnyRoute } from '@tanstack/react-router'
import { validateCitationLocationSearch } from '@/features/rag/citation-location-search'
import { DocumentEditorPage } from '@/pages/documents/document-editor-page'

export function documentEditorRoute(parentRoute: AnyRoute) {
  const route = createRoute({
    getParentRoute: () => parentRoute,
    path: '/documents/$documentId',
    validateSearch: validateCitationLocationSearch,
    component: DocumentEditorRouteComponent,
  })

  function DocumentEditorRouteComponent() {
    const { documentId } = route.useParams()
    const { snapshotVersion, blockId } = route.useSearch()

    return (
      <DocumentEditorPage documentId={documentId} citationLocation={{ snapshotVersion, blockId }} />
    )
  }

  return route
}
