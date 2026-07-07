import { registry } from '@docweave/api/registry'
import { createTuyau } from '@tuyau/core/client'
import { getAccessToken } from './auth'

/**
 * 统一通过同一个 Tuyau client 访问后端。
 * 本地开发继续复用 Vite 的 /api 代理，避免页面层关心真实后端地址。
 */
export const tuyau = createTuyau({
  registry,
  baseUrl: '/',
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getAccessToken()

        // 统一在 client 层注入 access token，避免每个 query/mutation 手工拼接认证头。
        if (token) {
          request.headers.set('authorization', `Bearer ${token}`)
        }
      },
    ],
  },
})
