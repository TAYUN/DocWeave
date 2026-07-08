import { createRoute, type AnyRoute } from '@tanstack/react-router'
import { WorkbenchHomePage } from '@/pages/workbench/workbench-home-page'

export function homeRoute(parentRoute: AnyRoute) {
  return createRoute({
    getParentRoute: () => parentRoute,
    path: '/',
    component: WorkbenchHomePage,
  })
}
