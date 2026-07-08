import { createRootRoute, createRouter } from '@tanstack/react-router'
import { RootLayout } from './layouts/root-layout'
import { publicLayoutRoute } from './routes/public/public-layout.route'
import { appLayoutRoute } from './routes/app/app-layout.route'
import { loginRoute } from './routes/public/login.route'
import { homeRoute } from './routes/app/home.route'
import { spaceDetailRoute } from './routes/app/spaces/space-detail.route'
import { documentEditorRoute } from './routes/app/documents/document-editor.route'

const rootRoute = createRootRoute({
  component: RootLayout,
})

const publicRoute = publicLayoutRoute(rootRoute)
const appRoute = appLayoutRoute(rootRoute)

export const routeTree = rootRoute.addChildren([
  publicRoute.addChildren([loginRoute(publicRoute)]),
  appRoute.addChildren([homeRoute(appRoute), spaceDetailRoute(appRoute), documentEditorRoute(appRoute)]),
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
