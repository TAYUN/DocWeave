import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class CollaborationInternalAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const providedSecret = ctx.request.header('x-collaboration-secret')

    // M4 第二阶段先复用现有协同 secret，避免再引一套内部凭证配置。
    if (providedSecret !== env.get('COLLAB_SECRET').release()) {
      return ctx.response.status(401).send({
        message: 'Unauthorized collaboration runtime request',
      })
    }

    return next()
  }
}
