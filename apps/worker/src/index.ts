import { Pool } from 'pg'
import { QdrantClient } from '@qdrant/js-client-rest'
import {
  createAliyunAiRuntimeConfig,
  createAliyunFetch,
} from '@docweave/adapters'
import { createAiRuntime } from '@docweave/ai'
import { readWorkerConfig } from './config.js'
import { runDocumentIndexJobs } from './run_document_index_jobs.js'

const config = readWorkerConfig()
const pool = new Pool({
  host: config.dbHost,
  port: config.dbPort,
  user: config.dbUser,
  password: config.dbPassword,
  database: config.dbDatabase,
})
const aiRuntimeConfig = createAliyunAiRuntimeConfig({
  apiKey: config.dashscopeApiKey,
  baseURL: config.dashscopeBaseUrl,
  embeddingModel: config.embeddingModel,
  embeddingDimensions: config.embeddingDimensions,
})
const ai = createAiRuntime(aiRuntimeConfig, {
  fetch: createAliyunFetch(aiRuntimeConfig),
})
const qdrant = new QdrantClient({
  url: config.qdrantUrl,
  apiKey: config.qdrantApiKey ?? undefined,
})

console.log(
  `[worker] polling every ${config.workerPollIntervalMs}ms with lease ${config.workerJobLeaseMs}ms`,
)

while (true) {
  try {
    await runDocumentIndexJobs({
      config,
      pool,
      ai,
      qdrant,
    })
  } catch (error) {
    console.error('[worker] polling cycle failed', error)
  }

  await sleep(config.workerPollIntervalMs)
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
