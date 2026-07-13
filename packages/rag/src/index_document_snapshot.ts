import { createHash } from 'node:crypto'
import type { RagIndexBlock } from '@docweave/contracts/rag'

export type IndexDocumentSnapshotInput = {
  workspaceId: string
  spaceId: string
  documentId: string
  snapshotVersion: number
  blocks: unknown[]
}

export type RagVectorPoint = {
  id: string
  vector: number[]
  payload: RagIndexBlock
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

type BlockLike = {
  id?: unknown
  type?: unknown
  props?: { level?: unknown }
  content?: unknown
  children?: unknown
}

function readBlockText(content: unknown) {
  if (!Array.isArray(content)) {
    return ''
  }

  return content
    .flatMap((inline) => {
      if (
        typeof inline === 'object' &&
        inline !== null &&
        'type' in inline &&
        inline.type === 'text' &&
        'text' in inline &&
        typeof inline.text === 'string'
      ) {
        return inline.text
      }

      return ''
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * 从快照原始 BlockNote blocks 生成索引单元，绝不把纯文本行号伪造为 blockId。
 */
export function buildBlockChunks(input: IndexDocumentSnapshotInput): RagIndexBlock[] {
  const chunks: RagIndexBlock[] = []
  const headingPath: Array<{ level: number; text: string }> = []

  function walk(blocks: unknown[]) {
    for (const value of blocks) {
      if (typeof value !== 'object' || value === null) {
        continue
      }

      const block = value as BlockLike
      const blockId = typeof block.id === 'string' ? block.id : null
      const plainText = readBlockText(block.content)
      const isHeading = block.type === 'heading'

      if (isHeading && plainText) {
        const level = typeof block.props?.level === 'number' ? block.props.level : 1
        while (headingPath.length > 0 && headingPath.at(-1)!.level >= level) {
          headingPath.pop()
        }
        headingPath.push({ level, text: plainText })
      }

      if (blockId && plainText) {
        chunks.push({
          workspaceId: input.workspaceId,
          spaceId: input.spaceId,
          documentId: input.documentId,
          snapshotVersion: input.snapshotVersion,
          blockId,
          chunkId: `${blockId}:0`,
          headingPath: headingPath.map((heading) => heading.text),
          plainText,
        })
      }

      if (Array.isArray(block.children)) {
        walk(block.children)
      }
    }
  }

  walk(input.blocks)
  return chunks
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

function toStablePointId(block: RagIndexBlock) {
  // Qdrant point id 必须是 uint64 或 UUID，这里用稳定哈希生成可重复的 UUID 形态，避免同版本重复写入变成脏重复点。
  const hex = createHash('sha256')
    .update(`${block.documentId}:${block.snapshotVersion}:${block.blockId}:${block.chunkId}`)
    .digest('hex')
    .slice(0, 32)

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

export async function indexDocumentSnapshot(
  input: IndexDocumentSnapshotInput,
  dependencies: IndexDocumentSnapshotDependencies,
): Promise<IndexDocumentSnapshotResult> {
  const chunks = buildBlockChunks(input)

  if (chunks.length === 0) {
    return {
      chunkCount: 0,
      status: (await dependencies.canPublish(input.snapshotVersion)) ? 'published' : 'superseded',
    }
  }

  const vectors: number[][] = []

  for (const batch of chunkArray(chunks, MAX_EMBEDDING_BATCH_SIZE)) {
    const batchVectors = await dependencies.embed(batch.map((chunk) => chunk.plainText))
    assertVectorDimensions(batchVectors, dependencies.embeddingDimensions)
    vectors.push(...batchVectors)
  }

  await dependencies.ensureCollectionDimensions(dependencies.embeddingDimensions)

  const points = chunks.map<RagVectorPoint>((chunk, chunkIndex) => ({
    id: toStablePointId(chunk),
    vector: vectors[chunkIndex]!,
    payload: chunk,
  }))

  await dependencies.upsert(points)

  return {
    chunkCount: chunks.length,
    status: (await dependencies.canPublish(input.snapshotVersion)) ? 'published' : 'superseded',
  }
}
