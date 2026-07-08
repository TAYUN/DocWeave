import { createRoute, type AnyRoute } from '@tanstack/react-router'
import { PublicLayout } from '../../layouts/public-layout'

export function publicLayoutRoute(parentRoute: AnyRoute) {
  return createRoute({
    getParentRoute: () => parentRoute,
    id: 'public',
    component: PublicLayout,
  })
}
