import { createRoute, type AnyRoute } from '@tanstack/react-router'
import { SpaceDetailPage } from '../../../../pages/spaces/space-detail-page'

export function spaceDetailRoute(parentRoute: AnyRoute) {
  const route = createRoute({
    getParentRoute: () => parentRoute,
    path: '/spaces/$spaceId',
    component: SpaceDetailRouteComponent,
  })

  function SpaceDetailRouteComponent() {
    const { spaceId } = route.useParams()

    return <SpaceDetailPage spaceId={spaceId} />
  }

  return route
}
