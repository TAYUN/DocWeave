import type { HttpContext } from '@adonisjs/core/http'
import RagService from '#services/rag_service'

export default class RagController {
  constructor(private rag = new RagService()) {}

  async search({ request }: HttpContext) {
    const payload = request.only(['query'])

    return {
      data: await this.rag.search(payload.query ?? ''),
    }
  }

  async chat({ request }: HttpContext) {
    const payload = request.only(['message'])

    return {
      data: {
        message: payload.message ?? '',
        answer:
          'RAG chat scaffold is wired. Next step is replacing this placeholder with streaming orchestration via packages/rag and packages/ai.',
      },
    }
  }
}
