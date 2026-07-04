import { getDocumentById, listDocuments, listSpaces } from './api'

export type WorkspaceStage = {
  id: string
  name: string
  summary: string
  owner: string
}

const stages: WorkspaceStage[] = [
  {
    id: 'foundation',
    name: 'Foundation',
    summary: 'Stabilize runtime boundaries, local infrastructure, and shared contracts.',
    owner: 'Platform',
  },
  {
    id: 'editing',
    name: 'Editing Flow',
    summary: 'Connect BlockNote editing, collaboration entrypoints, and document metadata.',
    owner: 'Editor',
  },
  {
    id: 'retrieval',
    name: 'Retrieval',
    summary: 'Prepare snapshots, retrieval orchestration, and streaming AI surfaces.',
    owner: 'AI + RAG',
  },
]

export async function listStages() {
  return Promise.resolve(stages)
}

export { getDocumentById, listDocuments, listSpaces }
