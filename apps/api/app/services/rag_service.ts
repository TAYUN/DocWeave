import type { RagSearchResponse } from '@docweave/contracts/rag'

const SCAFFOLD_HITS: RagSearchResponse['hits'] = [
  {
    score: 0.92,
    snippet: 'Snapshot, chunking, and embedding run in worker-owned stages.',
    citation: {
      id: 'c1',
      documentId: 'doc-rag-pipeline',
      snapshotVersion: 1,
      blockId: 'block-rag-pipeline',
      chunkId: 'chunk-rag-pipeline-1',
      quote: 'Snapshot, chunking, and embedding run in worker-owned stages.',
    },
  },
]

export default class RagService {
  async search(searchText: string): Promise<RagSearchResponse> {
    // 当前真实检索能力尚未接入，这里先把占位实现集中到 service 中维护，
    // 这样 HTTP 与 MCP 后续接入真实 RAG 时只需要替换这一处。
    return {
      searchText,
      hits: SCAFFOLD_HITS,
    }
  }
}
