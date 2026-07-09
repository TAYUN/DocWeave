import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AiEditorController = () => import('#controllers/ai_editor_controller')
const AuthController = () => import('#controllers/auth_controller')
const CollaborationTokensController = () => import('#controllers/collaboration_tokens_controller')
const DocumentsController = () => import('#controllers/documents_controller')
const RagController = () => import('#controllers/rag_controller')
const SpacesController = () => import('#controllers/spaces_controller')

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

// MCP 路由单独挂载，便于让外部 agent 通过标准协议直接调用 DocWeave 能力。
router.mcp().use(middleware.mcp())

router
  .group(() => {
    router.post('/auth/login', [AuthController, 'login'])

    router
      .group(() => {
        router.post('/auth/logout', [AuthController, 'logout'])
        router.get('/auth/me', [AuthController, 'me'])

        router.get('/spaces', [SpacesController, 'index'])
        router.post('/spaces', [SpacesController, 'store'])
        router.get('/spaces/:spaceId/tree', [SpacesController, 'tree'])

        router.get('/documents', [DocumentsController, 'index'])
        router.post('/documents', [DocumentsController, 'store'])
        router.get('/documents/:documentId', [DocumentsController, 'show'])
        router.patch('/documents/:documentId', [DocumentsController, 'update'])
        router.post('/collaboration/token', [CollaborationTokensController, 'store'])
      })
      // M2 工作台入口以“先认证、再进入业务资源”为边界，匿名请求不应直接读取空间和文档。
      .use(middleware.auth())

    router.post('/ai/editor', [AiEditorController, 'store'])

    router.post('/rag/search', [RagController, 'search'])
    router.post('/rag/chat', [RagController, 'chat'])
  })
  .prefix('/api')
