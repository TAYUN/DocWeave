import { registry } from '@docweave/api/registry'
import { createTuyau } from '@tuyau/core/client'

/**
 * 统一通过同一个 Tuyau client 访问后端。
 * 本地开发继续复用 Vite 的 /api 代理，避免页面层关心真实后端地址。
 */
export const tuyau = createTuyau({
  registry,
  baseUrl: '/',
})
