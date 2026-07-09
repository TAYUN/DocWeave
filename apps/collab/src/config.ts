export type CollabConfig = {
  host: string
  port: number
  secret: string
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
  }
}

function parsePort(value: string | undefined) {
  const port = Number(value ?? '3334')

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive integer')
  }

  return port
}
