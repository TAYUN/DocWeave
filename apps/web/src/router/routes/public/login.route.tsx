import { createRoute, redirect, type AnyRoute } from '@tanstack/react-router'
import { hasAccessToken } from '@/lib/auth'
import { LoginPage } from '@/pages/auth/login-page'

export function loginRoute(parentRoute: AnyRoute) {
  return createRoute({
    getParentRoute: () => parentRoute,
    path: '/login',
    beforeLoad: () => {
      if (hasAccessToken()) {
        throw redirect({ to: '/' })
      }
    },
    component: LoginPage,
  })
}
