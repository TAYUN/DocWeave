import type { HttpContext } from '@adonisjs/core/http'
import { Readable } from 'node:stream'
import { aiEditorRequestValidator } from '#validators/runtime'
import EditorAiService, {
  EditorAiDocumentNotFoundError,
  EditorAiProviderConfigError,
} from '#services/editor_ai_service'

export default class AiEditorController {
  constructor(private editorAi = new EditorAiService()) {}

  async store({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(aiEditorRequestValidator)
    const body = request.body() as {
      messages?: unknown
      toolDefinitions?: unknown
    }

    if (
      !Array.isArray(body.messages) ||
      !body.toolDefinitions ||
      typeof body.toolDefinitions !== 'object'
    ) {
      return response.status(422).send({
        message: 'Editor AI messages and toolDefinitions are required',
      })
    }

    let streamResponse: Response

    try {
      streamResponse = await this.editorAi.stream({
        userId: auth.getUserOrFail().id,
        payload: {
          ...payload,
          messages: body.messages as never,
          toolDefinitions: body.toolDefinitions as Record<string, unknown>,
        },
      })
    } catch (error) {
      if (error instanceof EditorAiDocumentNotFoundError) {
        return response.status(404).send({ message: error.message })
      }

      if (error instanceof EditorAiProviderConfigError) {
        return response.status(503).send({ message: error.message })
      }

      throw error
    }

    for (const [name, value] of streamResponse.headers) {
      response.header(name, value)
    }

    if (!streamResponse.body) {
      return response.status(502).send({ message: 'AI provider returned an empty stream' })
    }

    response.stream(Readable.fromWeb(streamResponse.body as never))
  }
}
