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

type RequestOptions = {
  body?: unknown
  method?: 'GET' | 'POST' | 'PATCH'
}

async function requestJson<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(path, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const fallback = `Request failed: ${response.status} ${response.statusText}`
    let message = fallback

    try {
      const payload = (await response.json()) as { message?: string }
      message = payload.message ?? fallback
    } catch {
      message = fallback
    }

    throw new Error(message)
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

export async function createSpace(input: { name: string; summary: string }) {
  const payload = await requestJson<ApiEnvelope<ApiSpace>>('/api/spaces', {
    method: 'POST',
    body: input,
  })
  return payload.data
}

export async function createDocument(input: {
  spaceId: string
  title: string
  summary: string
}) {
  const payload = await requestJson<ApiEnvelope<ApiDocument>>('/api/documents', {
    method: 'POST',
    body: input,
  })
  return payload.data
}

export async function updateDocument(input: {
  documentId: string
  title?: string
  summary?: string
}) {
  const payload = await requestJson<ApiEnvelope<ApiDocument>>(
    `/api/documents/${input.documentId}`,
    {
      method: 'PATCH',
      body: {
        title: input.title,
        summary: input.summary,
      },
    },
  )
  return payload.data
}
