import DocweaveCatalogService from '#services/docweave_catalog_service'
import {
  createDocumentValidator,
  updateDocumentValidator,
} from '#validators/documents'
import type { HttpContext } from '@adonisjs/core/http'

export default class DocumentsController {
  constructor(private catalog = new DocweaveCatalogService()) {}

  async index() {
    return {
      data: await this.catalog.listDocuments(),
    }
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createDocumentValidator)

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

    response.status(201)

    return {
      message: 'Document created',
      data: document,
    }
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
    const patch = await request.validateUsing(updateDocumentValidator)

    // Vine 负责字段级约束，这里保留“至少提交一个可编辑字段”的业务边界。
    if (patch.title === undefined && patch.summary === undefined && patch.content === undefined) {
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
