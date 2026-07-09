import CollaborationTokenService from '#services/collaboration_token_service'
import DocweaveCatalogService from '#services/docweave_catalog_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class CollaborationTokensController {
  constructor(
    private catalog = new DocweaveCatalogService(),
    private tokens = new CollaborationTokenService(),
  ) {}

  async store({ auth, request, response }: HttpContext) {
    const documentId = `${request.input('documentId') ?? ''}`.trim()

    if (!documentId) {
      return response.status(422).send({
        message: 'documentId is required',
      })
    }

    const document = await this.catalog.getDocument(documentId)

    if (!document) {
      return response.status(404).send({
        message: 'Document not found',
      })
    }

    const user = auth.getUserOrFail()

    return {
      data: this.tokens.issueDocumentToken({
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
      }),
    }
  }
}
