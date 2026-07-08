import { createRoute, redirect, type AnyRoute } from '@tanstack/react-router'
import { hasAccessToken } from '../../../lib/auth'
import { AppLayout } from '../../layouts/app-layout'

export function appLayoutRoute(parentRoute: AnyRoute) {
  return createRoute({
    getParentRoute: () => parentRoute,
    id: 'app',
    beforeLoad: () => {
      if (!hasAccessToken()) {
        throw redirect({ to: '/login' })
      }
    },
    component: AppLayout,
  })
}
