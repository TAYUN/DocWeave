import OpenAI from 'openai'
import { Pool } from 'pg'
import { QdrantClient } from '@qdrant/js-client-rest'
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
const openai = new OpenAI({
  apiKey: config.dashscopeApiKey,
  baseURL: config.dashscopeBaseUrl,
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
      openai,
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
