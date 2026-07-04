import DocweaveCatalogService from '#services/docweave_catalog_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class DocumentsController {
  constructor(private catalog = new DocweaveCatalogService()) {}

  async index() {
    return {
      data: await this.catalog.listDocuments(),
    }
  }

  async store({ request, response }: HttpContext) {
    const payload = request.only(['spaceId', 'title', 'summary'])

    if (!payload.spaceId || !payload.title || payload.summary === undefined) {
      return response.status(422).send({
        message: 'spaceId, title, and summary are required',
      })
    }

    const document = await this.catalog.createDocument({
      spaceId: payload.spaceId,
      title: payload.title,
      summary: payload.summary,
    })

    if (!document) {
      return response.status(404).send({
        message: 'Space not found',
      })
    }

    return response.status(201).send({
      message: 'Document created',
      data: document,
    })
  }

  async show({ params, response }: HttpContext) {
    const document = await this.catalog.getDocument(params.documentId)

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
    const patch = request.only(['title', 'summary'])

    if (patch.title === undefined && patch.summary === undefined) {
      return response.status(422).send({
        message: 'At least one editable field is required',
      })
    }

    const document = await this.catalog.updateDocument(
      params.documentId,
      patch,
    )

    if (!document) {
      return response.status(404).send({
        message: 'Document not found',
      })
    }

    return {
      message: 'Document updated',
      data: document,
    }
  }
}
