import type { HttpContext } from '@adonisjs/core/http'
import { aiEditorRequestValidator } from '#validators/runtime'

export default class AiEditorController {
  async store({ request }: HttpContext) {
    const payload = await request.validateUsing(aiEditorRequestValidator)

    return {
      data: {
        documentId: payload.documentId ?? 'doc-editor-runtime',
        instruction: payload.instruction,
        provider: 'packages/ai',
        status: 'queued-for-provider-integration',
      },
    }
  }
}
