import { createRoute, type AnyRoute } from '@tanstack/react-router'
import { SearchPage } from '@/pages/rag/search-page'

export function searchRoute(parentRoute: AnyRoute) {
  return createRoute({ getParentRoute: () => parentRoute, path: '/search', component: SearchPage })
}
