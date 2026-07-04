import type { HttpContext } from '@adonisjs/core/http'

export default class AuthController {
  async login({ request }: HttpContext) {
    const payload = request.only(['email'])

    return {
      message: 'DocWeave auth scaffold is active',
      user: {
        id: 'user-demo',
        email: payload.email ?? 'owner@docweave.dev',
        name: 'DocWeave Owner',
      },
      token: {
        type: 'bearer',
        value: 'scaffold-token',
      },
    }
  }

  async logout() {
    return {
      message: 'Logout endpoint scaffolded',
    }
  }

  async me() {
    return {
      user: {
        id: 'user-demo',
        email: 'owner@docweave.dev',
        name: 'DocWeave Owner',
        role: 'workspace_admin',
      },
    }
  }
}
