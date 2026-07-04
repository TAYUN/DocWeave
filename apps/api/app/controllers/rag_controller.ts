import type { HttpContext } from '@adonisjs/core/http'

export default class RagController {
  async search({ request }: HttpContext) {
    const payload = request.only(['query'])

    return {
      data: {
        query: payload.query ?? '',
        hits: [
          {
            documentId: 'doc-rag-pipeline',
            score: 0.92,
            snippet: 'Snapshot, chunking, and embedding run in worker-owned stages.',
          },
        ],
      },
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
