import type { HttpContext } from '@adonisjs/core/http'
import CollaborationRuntimeService from '#services/collaboration_runtime_service'
import { updateCollaborationRuntimeValidator } from '#validators/runtime'

export default class InternalCollaborationRuntimeController {
  constructor(private runtime = new CollaborationRuntimeService()) {}

  async show({ params, response, serialize }: HttpContext) {
    const document = await this.runtime.getRuntimeDocument(params.documentId)

    if (!document) {
      return response.status(404).send({
        message: 'Document not found',
      })
    }

    return serialize(document)
  }

  async update({ params, request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(updateCollaborationRuntimeValidator)
    const document = await this.runtime.updateRuntimeDocument(params.documentId, payload)

    if (!document) {
      return response.status(404).send({
        message: 'Document not found',
      })
    }

    return serialize(document)
  }
}
