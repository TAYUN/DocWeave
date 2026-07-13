import type { HttpContext } from '@adonisjs/core/http'
import { Readable } from 'node:stream'
import { aiEditorRequestValidator } from '#validators/runtime'
import EditorAiService, {
  EditorAiDocumentNotFoundError,
  EditorAiProviderConfigError,
} from '#services/editor_ai_service'
import { apiErrors, toApiErrorResponse } from '#exceptions/error_messages'

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
      return response.status(422).send(toApiErrorResponse(apiErrors.editorAiRequestInvalid))
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
        return response.status(404).send(toApiErrorResponse(apiErrors.editorAiDocumentNotFound))
      }

      if (error instanceof EditorAiProviderConfigError) {
        return response
          .status(503)
          .send(toApiErrorResponse(apiErrors.editorAiProviderConfigMissing))
      }

      throw error
    }

    for (const [name, value] of streamResponse.headers) {
      response.header(name, value)
    }

    if (!streamResponse.body) {
      return response.status(502).send(toApiErrorResponse(apiErrors.aiProviderReturnedEmptyStream))
    }

    response.stream(Readable.fromWeb(streamResponse.body as never))
  }
}
