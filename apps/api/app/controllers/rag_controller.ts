import type { HttpContext } from '@adonisjs/core/http'
import type { RagChatResponse } from '@docweave/contracts/rag'
import RagService from '#services/rag_service'
import { ragChatValidator, ragSearchValidator } from '#validators/runtime'

export default class RagController {
  constructor(private rag = new RagService()) {}

  async search({ request }: HttpContext) {
    const payload = await request.validateUsing(ragSearchValidator)

    return {
      data: await this.rag.search(payload.searchText),
    }
  }

  async chat({ request }: HttpContext) {
    await request.validateUsing(ragChatValidator)
    const response: RagChatResponse = {
      messageId: null,
      answer:
        'RAG chat scaffold is wired. Next step is replacing this placeholder with streaming orchestration via packages/rag and packages/ai.',
      citations: [],
      finishReason: 'stop',
      usage: null,
    }

    return {
      data: response,
    }
  }
}
