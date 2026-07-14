import { createRootRoute, createRouter } from '@tanstack/react-router'
import { RootLayout } from '@/router/layouts/root-layout'
import { appLayoutRoute } from '@/router/routes/app/app-layout.route'
import { documentEditorRoute } from '@/router/routes/app/documents/document-editor.route'
import { homeRoute } from '@/router/routes/app/home.route'
import { chatRoute } from '@/router/routes/app/rag/chat.route'
import { searchRoute } from '@/router/routes/app/rag/search.route'
import { spaceDetailRoute } from '@/router/routes/app/spaces/space-detail.route'
import { loginRoute } from '@/router/routes/public/login.route'
import { publicLayoutRoute } from '@/router/routes/public/public-layout.route'

const rootRoute = createRootRoute({
  component: RootLayout,
})

const publicRoute = publicLayoutRoute(rootRoute)
const appRoute = appLayoutRoute(rootRoute)

export const routeTree = rootRoute.addChildren([
  publicRoute.addChildren([loginRoute(publicRoute)]),
  appRoute.addChildren([
    homeRoute(appRoute),
    spaceDetailRoute(appRoute),
    documentEditorRoute(appRoute),
    searchRoute(appRoute),
    chatRoute(appRoute),
  ]),
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
