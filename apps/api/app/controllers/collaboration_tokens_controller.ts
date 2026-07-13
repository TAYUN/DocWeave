import type { HttpContext } from '@adonisjs/core/http'
import CollaborationTokenService from '#services/collaboration_token_service'
import DocweaveCatalogService from '#services/docweave_catalog_service'
import { collaborationTokenValidator } from '#validators/runtime'
import { apiErrors, toApiErrorResponse } from '#exceptions/error_messages'

export default class CollaborationTokensController {
  constructor(
    private catalog = new DocweaveCatalogService(),
    private tokens = new CollaborationTokenService()
  ) {}

  async store({ auth, request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(collaborationTokenValidator)

    const document = await this.catalog.getDocument(payload.documentId)

    if (!document) {
      return response.status(404).send(toApiErrorResponse(apiErrors.documentNotFound))
    }

    const user = auth.getUserOrFail()

    return serialize(
      this.tokens.issueDocumentToken({
        document,
        capabilities: {
          canRead: true,
          canEdit: true,
        },
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          initials: user.initials,
        },
      })
    )
  }
}
