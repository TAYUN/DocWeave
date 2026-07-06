type RagSearchHit = {
  documentId: string
  score: number
  snippet: string
}

type RagSearchResult = {
  query: string
  hits: RagSearchHit[]
}

const SCAFFOLD_HITS: RagSearchHit[] = [
  {
    documentId: 'doc-rag-pipeline',
    score: 0.92,
    snippet: 'Snapshot, chunking, and embedding run in worker-owned stages.',
  },
]

export default class RagService {
  async search(query: string): Promise<RagSearchResult> {
    // 当前真实检索能力尚未接入，这里先把占位实现集中到 service 中维护，
    // 这样 HTTP 与 MCP 后续接入真实 RAG 时只需要替换这一处。
    return {
      query,
      hits: SCAFFOLD_HITS,
    }
  }
}
