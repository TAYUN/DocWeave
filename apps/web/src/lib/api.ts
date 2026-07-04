export type ApiSpace = {
  id: string
  name: string
  summary: string
  rootDocuments: string[]
}

export type ApiDocument = {
  id: string
  title: string
  status: 'draft' | 'review' | 'ready'
  summary: string
  spaceId: string
  updatedAt: string
}

type ApiEnvelope<T> = {
  data: T
}

async function requestJson<T>(path: string) {
  const response = await fetch(path, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as T
}

export async function listSpaces() {
  const payload = await requestJson<ApiEnvelope<ApiSpace[]>>('/api/spaces')
  return payload.data
}

export async function listDocuments() {
  const payload = await requestJson<ApiEnvelope<ApiDocument[]>>('/api/documents')
  return payload.data
}

export async function getDocumentById(documentId: string) {
  const payload = await requestJson<ApiEnvelope<ApiDocument>>(`/api/documents/${documentId}`)
  return payload.data
}
