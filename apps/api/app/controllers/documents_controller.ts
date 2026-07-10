import { createDocument } from '#application/documents/create_document'
import { getDocument } from '#application/documents/get_document'
import { listDocuments } from '#application/documents/list_documents'
import { EmptyDocumentPatchError, updateDocument } from '#application/documents/update_document'
import DocweaveCatalogService from '#services/docweave_catalog_service'
import DocumentProcessingService, {
  MissingStableSnapshotError,
  SnapshotVersionNotFoundError,
} from '#services/document_processing_service'
import {
  createDocumentValidator,
  triggerDocumentIndexValidator,
  updateDocumentValidator,
} from '#validators/documents'
import type { HttpContext } from '@adonisjs/core/http'

export default class DocumentsController {
  constructor(
    private catalog = new DocweaveCatalogService(),
    private processing = new DocumentProcessingService()
  ) {}

  async index() {
    return {
      data: await listDocuments(this.catalog),
    }
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createDocumentValidator)

    const document = await createDocument(
      {
        spaceId: payload.spaceId,
        title: payload.title,
        summary: payload.summary,
      },
      this.catalog
    )

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
    const document = await getDocument(params.documentId, this.catalog)

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

    try {
      const document = await updateDocument(params.documentId, patch, this.catalog)

      if (!document) {
        return response.status(404).send({
          message: 'Document not found',
        })
      }

      return {
        message: 'Document updated',
        data: document,
      }
    } catch (error) {
      if (error instanceof EmptyDocumentPatchError) {
        return response.status(422).send({
          message: error.message,
        })
      }

      throw error
    }
  }

  async createSnapshot({ params, response, serialize }: HttpContext) {
    const result = await this.processing.createSnapshot(params.documentId)

    if (!result) {
      return response.status(404).send({
        message: 'Document not found',
      })
    }

    return serialize(result)
  }

  async triggerIndex({ auth, params, request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(triggerDocumentIndexValidator)

    try {
      const result = await this.processing.triggerIndex(
        params.documentId,
        auth.getUserOrFail().id,
        payload
      )

      if (!result) {
        return response.status(404).send({
          message: 'Document not found',
        })
      }

      return serialize(result)
    } catch (error) {
      if (error instanceof MissingStableSnapshotError) {
        return response.status(422).send({
          message: error.message,
        })
      }

      if (error instanceof SnapshotVersionNotFoundError) {
        return response.status(404).send({
          message: error.message,
        })
      }

      throw error
    }
  }

  async status({ params, response, serialize }: HttpContext) {
    const result = await this.processing.getStatus(params.documentId)

    if (!result) {
      return response.status(404).send({
        message: 'Document not found',
      })
    }

    return serialize(result)
  }
}
