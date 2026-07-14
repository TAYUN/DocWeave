import type {
  RagRetrievalBackend,
  RagRetrievalBackendRequest,
  RagRetrievalCandidate,
} from '@docweave/rag'

type QdrantSearchClient = {
  search(
    collection: string,
    request: {
      vector: number[]
      limit?: number
      with_payload: boolean
      filter: {
        should: Array<{
          must: Array<{
            key: 'documentId' | 'snapshotVersion'
            match: { value: string | number }
          }>
        }>
      }
    }
  ): Promise<Array<{ score: number; payload?: unknown }>>
}

/** 将领域检索请求转换为 Qdrant filter；权限与命中有效性仍由上层领域边界负责。 */
export class QdrantRagRetrievalBackend implements RagRetrievalBackend {
  constructor(
    private collectionName: string,
    private client: QdrantSearchClient
  ) {}

  async search(request: RagRetrievalBackendRequest): Promise<RagRetrievalCandidate[]> {
    const points = await this.client.search(this.collectionName, {
      vector: request.queryVector,
      limit: request.limit,
      with_payload: true,
      filter: {
        should: request.documents.map((document) => ({
          must: [
            { key: 'documentId', match: { value: document.documentId } },
            { key: 'snapshotVersion', match: { value: document.snapshotVersion } },
          ],
        })),
      },
    })

    return points.map((point) => ({ score: point.score, payload: point.payload ?? null }))
  }
}
