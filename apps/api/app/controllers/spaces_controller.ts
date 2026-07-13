import { createSpace } from '#application/spaces/create_space'
import { getSpaceTree } from '#application/spaces/get_space_tree'
import { listSpaces } from '#application/spaces/list_spaces'
import DocweaveCatalogService from '#services/docweave_catalog_service'
import { createSpaceValidator } from '#validators/spaces'
import type { HttpContext } from '@adonisjs/core/http'
import { apiErrors, apiSuccessMessages, toApiErrorResponse } from '#exceptions/error_messages'

export default class SpacesController {
  constructor(private catalog = new DocweaveCatalogService()) {}

  async index() {
    return {
      data: await listSpaces(this.catalog),
    }
  }

  async tree({ params, response }: HttpContext) {
    const tree = await getSpaceTree(params.spaceId, this.catalog)

    if (!tree) {
      return response.status(404).send(toApiErrorResponse(apiErrors.spaceNotFound))
    }

    return {
      data: tree,
    }
  }

  async store({ request, response }: HttpContext) {
    // 统一走 Vine 校验，既能收口服务端约束，也能让 registry 生成准确的 body 类型。
    const payload = await request.validateUsing(createSpaceValidator)

    const space = await createSpace(
      {
        name: payload.name,
        summary: payload.summary,
      },
      this.catalog
    )

    response.status(201)

    return {
      message: apiSuccessMessages.spaceCreated,
      data: space,
    }
  }
}
