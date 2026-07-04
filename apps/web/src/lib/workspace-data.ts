export type WorkspaceStage = {
  id: string
  name: string
  summary: string
  owner: string
}

export type WorkspaceDocument = {
  id: string
  title: string
  status: 'draft' | 'review' | 'ready'
  updatedAt: string
  summary: string
  spaceId: string
}

export type WorkspaceSpace = {
  id: string
  name: string
  summary: string
  documentIds: string[]
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

const documents: WorkspaceDocument[] = [
  {
    id: 'doc-editor-runtime',
    title: 'Editor Runtime Baseline',
    status: 'draft',
    updatedAt: '2026-07-04',
    summary: 'Define the first end-to-end editor shell, route guard, and workspace layout.',
    spaceId: 'product',
  },
  {
    id: 'doc-collab-token',
    title: 'Collaboration Token Flow',
    status: 'review',
    updatedAt: '2026-07-03',
    summary: 'Outline how api, collab, and auth boundaries exchange short-lived access tokens.',
    spaceId: 'architecture',
  },
  {
    id: 'doc-rag-pipeline',
    title: 'RAG Snapshot Pipeline',
    status: 'ready',
    updatedAt: '2026-07-02',
    summary: 'Track snapshot, chunking, embedding, and Qdrant indexing milestones.',
    spaceId: 'ai-lab',
  },
]

const spaces: WorkspaceSpace[] = [
  {
    id: 'product',
    name: 'Product Workspace',
    summary: 'Experience, document UX, and editor-facing capabilities.',
    documentIds: ['doc-editor-runtime'],
  },
  {
    id: 'architecture',
    name: 'Architecture',
    summary: 'Runtime boundaries, infra contracts, and delivery sequencing.',
    documentIds: ['doc-collab-token'],
  },
  {
    id: 'ai-lab',
    name: 'AI Lab',
    summary: 'Prompt orchestration, retrieval quality, and AI workflow experiments.',
    documentIds: ['doc-rag-pipeline'],
  },
]

export async function listStages() {
  return Promise.resolve(stages)
}

export async function listSpaces() {
  return Promise.resolve(spaces)
}

export async function listDocuments() {
  return Promise.resolve(documents)
}

export async function getDocumentById(documentId: string) {
  const document = documents.find((entry) => entry.id === documentId) ?? null
  return Promise.resolve(document)
}
