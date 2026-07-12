export type CollabConfig = {
  host: string
  port: number
  secret: string
  apiBaseUrl: string
}

export function readCollabConfig(env = process.env): CollabConfig {
  const secret = env.COLLAB_SECRET?.trim()

  if (!secret) {
    throw new Error('COLLAB_SECRET is required')
  }

  return {
    host: env.HOST?.trim() || '127.0.0.1',
    port: parsePort(env.PORT),
    secret,
    apiBaseUrl: parseApiBaseUrl(env.API_BASE_URL),
  }
}

function parsePort(value: string | undefined) {
  const port = Number(value ?? '3334')

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive integer')
  }

  return port
}

function parseApiBaseUrl(value: string | undefined) {
  // 本地开发里 Adonis 常绑定 localhost/::1；这里避免把 collab 固定死到 127.0.0.1，
  // 否则在仅监听 IPv6 的场景下，onLoadDocument/onStoreDocument 会误报内部握手失败。
  const baseUrl = value?.trim() || 'http://localhost:3333'

  return baseUrl.replace(/\/+$/, '')
}
