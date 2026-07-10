import { createHash } from 'node:crypto'

export type IndexDocumentSnapshotInput = {
  documentId: string
  snapshotVersion: number
  plainText: string
  blocks: unknown[]
}

export type RagVectorPoint = {
  id: string
  vector: number[]
  payload: {
    documentId: string
    snapshotVersion: number
    chunkIndex: number
    text: string
  }
}

export type IndexDocumentSnapshotDependencies = {
  embeddingDimensions: number
  embed(texts: string[]): Promise<number[][]>
  ensureCollectionDimensions(dimensions: number): Promise<void>
  upsert(points: RagVectorPoint[]): Promise<void>
  canPublish(snapshotVersion: number): Promise<boolean>
}

export type IndexDocumentSnapshotResult = {
  chunkCount: number
  status: 'published' | 'superseded'
}

const MAX_EMBEDDING_BATCH_SIZE = 10

export function buildTextChunks(plainText: string) {
  const normalized = plainText
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (normalized.length > 0) {
    return normalized
  }

  const fallback = plainText.trim()
  return fallback ? [fallback] : []
}

function chunkArray<T>(items: T[], size: number) {
  const batches: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size))
  }

  return batches
}

function assertVectorDimensions(vectors: number[][], dimensions: number) {
  for (const vector of vectors) {
    if (vector.length !== dimensions) {
      throw new Error(
        `Embedding dimensions mismatch: expected ${dimensions}, received ${vector.length}`,
      )
    }
  }
}

function toStablePointId(documentId: string, snapshotVersion: number, chunkIndex: number) {
  // Qdrant point id 必须是 uint64 或 UUID，这里用稳定哈希生成可重复的 UUID 形态，避免同版本重复写入变成脏重复点。
  const hex = createHash('sha256')
    .update(`${documentId}:${snapshotVersion}:${chunkIndex}`)
    .digest('hex')
    .slice(0, 32)

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

export async function indexDocumentSnapshot(
  input: IndexDocumentSnapshotInput,
  dependencies: IndexDocumentSnapshotDependencies,
): Promise<IndexDocumentSnapshotResult> {
  const chunks = buildTextChunks(input.plainText)

  if (chunks.length === 0) {
    return {
      chunkCount: 0,
      status: (await dependencies.canPublish(input.snapshotVersion)) ? 'published' : 'superseded',
    }
  }

  const vectors: number[][] = []

  for (const batch of chunkArray(chunks, MAX_EMBEDDING_BATCH_SIZE)) {
    // ponytail: DashScope OpenAI 兼容模式暂不支持 text_type，后续若切 SDK 再下沉到 adapters。
    const batchVectors = await dependencies.embed(batch)
    assertVectorDimensions(batchVectors, dependencies.embeddingDimensions)
    vectors.push(...batchVectors)
  }

  await dependencies.ensureCollectionDimensions(dependencies.embeddingDimensions)

  const points = chunks.map<RagVectorPoint>((text, chunkIndex) => ({
    id: toStablePointId(input.documentId, input.snapshotVersion, chunkIndex),
    vector: vectors[chunkIndex]!,
    payload: {
      documentId: input.documentId,
      snapshotVersion: input.snapshotVersion,
      chunkIndex,
      text,
    },
  }))

  await dependencies.upsert(points)

  return {
    chunkCount: chunks.length,
    status: (await dependencies.canPublish(input.snapshotVersion)) ? 'published' : 'superseded',
  }
}
