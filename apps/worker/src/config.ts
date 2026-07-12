export type WorkerConfig = {
  nodeEnv: string
  host: string
  port: number
  dbHost: string
  dbPort: number
  dbUser: string
  dbPassword: string
  dbDatabase: string
  qdrantUrl: string
  qdrantApiKey: string | null
  qdrantCollection: string
  dashscopeApiKey: string
  dashscopeBaseUrl: string
  embeddingProvider: 'aliyun_openai_compatible'
  embeddingModel: string
  embeddingDimensions: number
  workerPollIntervalMs: number
  workerJobLeaseMs: number
}

export function readWorkerConfig(env = process.env): WorkerConfig {
  return {
    nodeEnv: env.NODE_ENV?.trim() || 'development',
    host: env.HOST?.trim() || '127.0.0.1',
    port: parsePositiveInteger(env.PORT, 'PORT', 3335),
    dbHost: readRequired(env.DB_HOST, 'DB_HOST'),
    dbPort: parsePositiveInteger(env.DB_PORT, 'DB_PORT', 5432),
    dbUser: readRequired(env.DB_USER, 'DB_USER'),
    // 本地 FlyEnv / Postgres 常见是空密码开发配置，这里不强行要求非空。
    dbPassword: env.DB_PASSWORD ?? '',
    dbDatabase: readRequired(env.DB_DATABASE, 'DB_DATABASE'),
    qdrantUrl: readRequired(env.QDRANT_URL, 'QDRANT_URL'),
    qdrantApiKey: env.QDRANT_API_KEY?.trim() || null,
    qdrantCollection: env.QDRANT_COLLECTION?.trim() || 'document_chunks_v1',
    dashscopeApiKey: readRequired(env.DASHSCOPE_API_KEY, 'DASHSCOPE_API_KEY'),
    dashscopeBaseUrl: readRequired(env.DASHSCOPE_BASE_URL, 'DASHSCOPE_BASE_URL'),
    embeddingProvider: 'aliyun_openai_compatible',
    embeddingModel: env.EMBEDDING_MODEL?.trim() || 'text-embedding-v4',
    embeddingDimensions: parsePositiveInteger(
      env.EMBEDDING_DIMENSIONS,
      'EMBEDDING_DIMENSIONS',
      1024,
    ),
    workerPollIntervalMs: parsePositiveInteger(
      env.WORKER_POLL_INTERVAL_MS,
      'WORKER_POLL_INTERVAL_MS',
      3000,
    ),
    workerJobLeaseMs: parsePositiveInteger(env.WORKER_JOB_LEASE_MS, 'WORKER_JOB_LEASE_MS', 30000),
  }
}

function readRequired(value: string | undefined, key: string) {
  const normalized = value?.trim()

  if (!normalized) {
    throw new Error(`${key} is required`)
  }

  return normalized
}

function parsePositiveInteger(value: string | undefined, key: string, fallback: number) {
  const parsed = Number(value ?? fallback)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer`)
  }

  return parsed
}
