import type {
  RagAuthorizedDocument,
  RagIndexBlock,
  RagRetrievalScope,
  RagSearchHit,
} from '@docweave/contracts/rag'

export type RagRetrievalCandidate = {
  score: number
  /** Transport adapters may return legacy or incomplete payloads, so validate at this boundary. */
  payload: unknown
}

export type RagRetrievalBackendRequest = {
  queryVector: number[]
  documents: Array<{
    documentId: string
    snapshotVersion: number
  }>
  limit?: number
}

/** Infrastructure adapters translate this domain request into a Qdrant filter. */
export type RagRetrievalBackend = {
  search(request: RagRetrievalBackendRequest): Promise<RagRetrievalCandidate[]>
}

export type RetrieveDocumentChunksInput = {
  queryVector: number[]
  scope: RagRetrievalScope
  limit?: number
}

type ActiveRagAuthorizedDocument = RagAuthorizedDocument & {
  latestIndexedVersion: number
}

function activeDocuments(scope: RagRetrievalScope): ActiveRagAuthorizedDocument[] {
  return scope.documents.filter((document): document is ActiveRagAuthorizedDocument => {
    const version = document.latestIndexedVersion

    return (
      typeof version === 'number' &&
      Number.isSafeInteger(version) &&
      version > 0 &&
      (scope.spaceId === undefined || document.spaceId === scope.spaceId)
    )
  })
}

function isRagIndexBlock(payload: unknown): payload is RagIndexBlock {
  if (typeof payload !== 'object' || payload === null) {
    return false
  }

  const value = payload as Record<string, unknown>
  const hasText = (field: unknown) => typeof field === 'string' && field.trim().length > 0

  return (
    hasText(value.workspaceId) &&
    hasText(value.spaceId) &&
    hasText(value.documentId) &&
    typeof value.snapshotVersion === 'number' &&
    Number.isSafeInteger(value.snapshotVersion) &&
    value.snapshotVersion > 0 &&
    hasText(value.blockId) &&
    hasText(value.chunkId) &&
    Array.isArray(value.headingPath) &&
    value.headingPath.every((heading) => typeof heading === 'string') &&
    hasText(value.plainText)
  )
}

function toSearchHit(
  candidate: RagRetrievalCandidate,
  document: RagAuthorizedDocument
): RagSearchHit | null {
  if (!isRagIndexBlock(candidate.payload)) {
    return null
  }

  const payload = candidate.payload
  if (
    payload.workspaceId !== document.workspaceId ||
    payload.spaceId !== document.spaceId ||
    payload.documentId !== document.documentId ||
    payload.snapshotVersion !== document.latestIndexedVersion
  ) {
    return null
  }

  return {
    score: candidate.score,
    snippet: payload.plainText,
    citation: {
      id: `${payload.documentId}:${payload.snapshotVersion}:${payload.blockId}:${payload.chunkId}`,
      documentId: payload.documentId,
      snapshotVersion: payload.snapshotVersion,
      blockId: payload.blockId,
      chunkId: payload.chunkId,
      quote: payload.plainText,
    },
  }
}

/**
 * 将已授权范围转成检索后端输入，并在后端返回后再次强制校验完整 payload 与每文档 active version。
 */
export async function retrieveDocumentChunks(
  input: RetrieveDocumentChunksInput,
  backend: RagRetrievalBackend
): Promise<RagSearchHit[]> {
  const documents = activeDocuments(input.scope)
  if (documents.length === 0) {
    return []
  }

  const candidates = await backend.search({
    queryVector: input.queryVector,
    documents: documents.map((document) => ({
      documentId: document.documentId,
      snapshotVersion: document.latestIndexedVersion,
    })),
    limit: input.limit,
  })
  const documentsById = new Map(documents.map((document) => [document.documentId, document]))

  const hits = candidates.flatMap((candidate) => {
    const documentId =
      typeof candidate.payload === 'object' && candidate.payload !== null
        ? (candidate.payload as { documentId?: unknown }).documentId
        : undefined
    const document = typeof documentId === 'string' ? documentsById.get(documentId) : undefined
    const hit = document ? toSearchHit(candidate, document) : null
    return hit ? [hit] : []
  })

  // 后端排序不是领域契约的一部分，先稳定按分数收敛再应用调用方的结果上限。
  hits.sort((left, right) => right.score - left.score)
  return input.limit === undefined ? hits : hits.slice(0, input.limit)
}
