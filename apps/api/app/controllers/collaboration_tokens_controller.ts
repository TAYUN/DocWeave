import type { HttpContext } from '@adonisjs/core/http'

export default class CollaborationTokensController {
  async store({ request }: HttpContext) {
    const payload = request.only(['documentId'])

    return {
      data: {
        documentId: payload.documentId ?? 'doc-editor-runtime',
        token: 'collab-scaffold-token',
        provider: 'apps/collab',
        expiresInSeconds: 900,
      },
    }
  }
}
