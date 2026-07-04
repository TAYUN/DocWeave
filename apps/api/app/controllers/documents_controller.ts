import DocweaveCatalogService from '#services/docweave_catalog_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class DocumentsController {
  constructor(private catalog = new DocweaveCatalogService()) {}

  async show({ params, response }: HttpContext) {
    const document = this.catalog.getDocument(params.documentId)

    if (!document) {
      return response.status(404).send({
        message: 'Document not found',
      })
    }

    return {
      data: document,
    }
  }

  async update({ params, request, response }: HttpContext) {
    const document = this.catalog.getDocument(params.documentId)

    if (!document) {
      return response.status(404).send({
        message: 'Document not found',
      })
    }

    const patch = request.only(['title', 'summary'])

    return {
      message: 'Document update scaffold accepted',
      data: {
        ...document,
        ...patch,
      },
    }
  }
}
