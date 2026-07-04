import router from '@adonisjs/core/services/router'
import AiEditorController from '#controllers/ai_editor_controller'
import AuthController from '#controllers/auth_controller'
import CollaborationTokensController from '#controllers/collaboration_tokens_controller'
import DocumentsController from '#controllers/documents_controller'
import RagController from '#controllers/rag_controller'
import SpacesController from '#controllers/spaces_controller'

router.get('/', () => {
  return {
    service: 'docweave-api',
    status: 'ok',
    scope: 'phase-1 scaffold',
  }
})

router.get('/api/health', () => {
  return {
    service: 'docweave-api',
    status: 'ready',
  }
})

router.group(() => {
  router.post('/auth/login', [AuthController, 'login'])
  router.post('/auth/logout', [AuthController, 'logout'])
  router.get('/auth/me', [AuthController, 'me'])

  router.get('/spaces', [SpacesController, 'index'])
  router.get('/spaces/:spaceId/tree', [SpacesController, 'tree'])

  router.get('/documents', [DocumentsController, 'index'])
  router.get('/documents/:documentId', [DocumentsController, 'show'])
  router.patch('/documents/:documentId', [DocumentsController, 'update'])

  router.post('/collaboration/token', [CollaborationTokensController, 'store'])
  router.post('/ai/editor', [AiEditorController, 'store'])

  router.post('/rag/search', [RagController, 'search'])
  router.post('/rag/chat', [RagController, 'chat'])
}).prefix('/api')
