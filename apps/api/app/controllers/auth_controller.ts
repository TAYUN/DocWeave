import User from '#models/user'
import UserTransformer from '#transformers/user_transformer'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class AuthController {
  async login({ request, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    const user = await User.verifyCredentials(email, password)
    const token = await User.accessTokens.create(user)

    // 登录返回统一走 serializer，保证前端只消费真实的 data 包裹结构。
    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    })
  }

  async logout({ auth }: HttpContext) {
    const user = auth.getUserOrFail()

    if (user.currentAccessToken) {
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    }

    return {
      message: 'Logged out successfully',
    }
  }

  async me({ auth, serialize }: HttpContext) {
    return serialize(UserTransformer.transform(auth.getUserOrFail()))
  }
}
