import { createRoute, type AnyRoute } from '@tanstack/react-router'
import { ChatPage } from '@/pages/rag/chat-page'

export function chatRoute(parentRoute: AnyRoute) {
  return createRoute({ getParentRoute: () => parentRoute, path: '/chat', component: ChatPage })
}
