import { createRoute, type AnyRoute } from '@tanstack/react-router'
import { DocumentEditorPage } from '@/pages/documents/document-editor-page'

export function documentEditorRoute(parentRoute: AnyRoute) {
  const route = createRoute({
    getParentRoute: () => parentRoute,
    path: '/documents/$documentId',
    component: DocumentEditorRouteComponent,
  })

  function DocumentEditorRouteComponent() {
    const { documentId } = route.useParams()

    return <DocumentEditorPage documentId={documentId} />
  }

  return route
}
