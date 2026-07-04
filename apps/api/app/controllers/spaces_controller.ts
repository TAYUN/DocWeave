import DocweaveCatalogService from '#services/docweave_catalog_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class SpacesController {
  constructor(private catalog = new DocweaveCatalogService()) {}

  async index() {
    return {
      data: await this.catalog.listSpaces(),
    }
  }

  async tree({ params, response }: HttpContext) {
    const tree = await this.catalog.getSpaceTree(params.spaceId)

    if (!tree) {
      return response.status(404).send({
        message: 'Space not found',
      })
    }

    return {
      data: tree,
    }
  }

  async store({ request, response }: HttpContext) {
    const payload = request.only(['name', 'summary'])

    if (!payload.name || !payload.summary) {
      return response.status(422).send({
        message: 'name and summary are required',
      })
    }

    const space = await this.catalog.createSpace({
      name: payload.name,
      summary: payload.summary,
    })

    return response.status(201).send({
      message: 'Space created',
      data: space,
    })
  }
}
