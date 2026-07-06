import { TuyauError } from '@tuyau/core/client'
import { tuyau } from './tuyau-client'

type ApiErrorPayload = {
  message?: string
}

type AwaitedRoute<T extends (...args: any[]) => PromiseLike<any>> = Awaited<ReturnType<T>>
// Tuyau 会把非 2xx 分支折进联合类型里，这里只抽取成功响应，避免页面层反复处理 void / error 分支。
type SuccessPayload<T> = Extract<T, { data: unknown }>
type SpacesIndexPayload = SuccessPayload<AwaitedRoute<typeof tuyau.api.spaces.index>>
type DocumentsIndexPayload = SuccessPayload<AwaitedRoute<typeof tuyau.api.documents.index>>
type DocumentShowPayload = SuccessPayload<AwaitedRoute<typeof tuyau.api.documents.show>>
type SpaceStorePayload = SuccessPayload<AwaitedRoute<typeof tuyau.api.spaces.store>>
type DocumentStorePayload = SuccessPayload<AwaitedRoute<typeof tuyau.api.documents.store>>
type DocumentUpdatePayload = SuccessPayload<AwaitedRoute<typeof tuyau.api.documents.update>>

export type ApiSpace = SpacesIndexPayload['data'][number]
export type ApiDocument = DocumentShowPayload['data']
export type CreateSpaceInput = NonNullable<Parameters<typeof tuyau.api.spaces.store>[0]['body']>
export type CreateDocumentInput = NonNullable<Parameters<typeof tuyau.api.documents.store>[0]['body']>
export type UpdateDocumentPatch = NonNullable<Parameters<typeof tuyau.api.documents.update>[0]['body']>

function toRequestError(error: unknown, fallback: string) {
  // 在统一 API 层把服务端 message 收口成 Error，页面和 query 层就不用了解 Tuyau 的错误细节。
  if (error instanceof TuyauError) {
    const message = (error.response as ApiErrorPayload | undefined)?.message
    return new Error(message ?? fallback)
  }

  if (error instanceof Error) {
    return error
  }

  return new Error(fallback)
}

export async function listSpaces(): Promise<SpacesIndexPayload['data']> {
  try {
    const payload = await tuyau.api.spaces.index({})
    return (payload as SpacesIndexPayload).data
  } catch (error) {
    throw toRequestError(error, 'Failed to load spaces')
  }
}

export async function listDocuments(): Promise<DocumentsIndexPayload['data']> {
  try {
    const payload = await tuyau.api.documents.index({})
    return (payload as DocumentsIndexPayload).data
  } catch (error) {
    throw toRequestError(error, 'Failed to load documents')
  }
}

export async function getDocumentById(documentId: string): Promise<DocumentShowPayload['data']> {
  try {
    const payload = await tuyau.api.documents.show({
      params: {
        documentId,
      },
    })
    return (payload as DocumentShowPayload).data
  } catch (error) {
    throw toRequestError(error, 'Failed to load document')
  }
}

export async function createSpace(input: CreateSpaceInput): Promise<SpaceStorePayload['data']> {
  try {
    const payload = await tuyau.api.spaces.store({
      body: input,
    })
    return (payload as SpaceStorePayload).data
  } catch (error) {
    throw toRequestError(error, 'Failed to create space')
  }
}

export async function createDocument(input: CreateDocumentInput): Promise<DocumentStorePayload['data']> {
  try {
    const payload = await tuyau.api.documents.store({
      body: input,
    })
    return (payload as DocumentStorePayload).data
  } catch (error) {
    throw toRequestError(error, 'Failed to create document')
  }
}

export async function updateDocument(
  input: { documentId: string } & UpdateDocumentPatch,
): Promise<DocumentUpdatePayload['data']> {
  try {
    const payload = await tuyau.api.documents.update({
      params: {
        documentId: input.documentId,
      },
      body: {
        title: input.title,
        summary: input.summary,
        content: input.content,
      },
    })
    return (payload as DocumentUpdatePayload).data
  } catch (error) {
    throw toRequestError(error, 'Failed to update document')
  }
}
