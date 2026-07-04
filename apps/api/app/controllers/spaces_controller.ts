import DocweaveCatalogService from '#services/docweave_catalog_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class SpacesController {
  constructor(private catalog = new DocweaveCatalogService()) {}

  async index() {
    return {
      data: this.catalog.listSpaces(),
    }
  }

  async tree({ params, response }: HttpContext) {
    const tree = this.catalog.getSpaceTree(params.spaceId)

    if (!tree) {
      return response.status(404).send({
        message: 'Space not found',
      })
    }

    return {
      data: tree,
    }
  }
}
