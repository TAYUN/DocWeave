import type { HttpContext } from '@adonisjs/core/http'

export default class AiEditorController {
  async store({ request }: HttpContext) {
    const payload = request.only(['documentId', 'instruction'])

    return {
      data: {
        documentId: payload.documentId ?? 'doc-editor-runtime',
        instruction: payload.instruction ?? 'Summarize current selection',
        provider: 'packages/ai',
        status: 'queued-for-provider-integration',
      },
    }
  }
}
