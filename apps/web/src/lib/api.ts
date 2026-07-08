import type { Data } from '@docweave/api/data'
import type { CurrentUserDto } from '@docweave/contracts/auth'
import type {
  CreateDocumentInput,
  DocumentDetailDto,
  DocumentSummaryDto,
  UpdateDocumentInput,
} from '@docweave/contracts/document'
import type {
  CreateSpaceInput,
  SpaceDto,
  SpaceTreeDto,
} from '@docweave/contracts/space'
import { TuyauError } from '@tuyau/core/client'
import { getAccessToken } from '@/lib/auth'
import { tuyau } from '@/lib/tuyau-client'

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
type SpaceTreePayload = SuccessPayload<AwaitedRoute<typeof tuyau.api.spaces.tree>>
type DocumentStorePayload = SuccessPayload<AwaitedRoute<typeof tuyau.api.documents.store>>
type DocumentUpdatePayload = SuccessPayload<AwaitedRoute<typeof tuyau.api.documents.update>>

export type ApiSpace = SpaceDto
export type ApiDocumentSummary = DocumentSummaryDto
export type ApiDocumentDetail = DocumentDetailDto
export type ApiSpaceTree = SpaceTreeDto
export type CurrentUser = CurrentUserDto
export type UpdateDocumentPatch = UpdateDocumentInput
export type LoginInput = {
  email: string
  password: string
}

export class AuthError extends Error {}

type LoginPayload = {
  data: {
    user: CurrentUser
    token: string
  }
}

type CurrentUserPayload = {
  data: Data.User
}

type LogoutPayload = {
  message: string
}

function toRequestError(error: unknown, fallback: string) {
  // 在统一 API 层把服务端 message 收口成 Error，页面和 query 层就不用了解 Tuyau 的错误细节。
  if (error instanceof TuyauError) {
    const message = (error.response as ApiErrorPayload | undefined)?.message

    // 让路由壳层和 query 可以统一识别“需要重新登录”的分支，而不是把它混进普通请求失败。
    if (error.isStatus(401)) {
      return new AuthError(message ?? '需要重新登录后才能继续访问')
    }

    return new Error(message ?? fallback)
  }

  if (error instanceof Error) {
    return error
  }

  return new Error(fallback)
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError
}

async function requestJson<T>(path: string, init: RequestInit, fallback: string) {
  const headers = new Headers(init.headers)
  headers.set('content-type', 'application/json')

  const token = getAccessToken()
  if (token) {
    headers.set('authorization', `Bearer ${token}`)
  }

  const response = await fetch(path, {
    ...init,
    headers,
  })
  const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload & T

    if (!response.ok) {
      if (response.status === 401) {
        throw new AuthError(payload.message ?? '需要重新登录后才能继续访问')
      }

    throw new Error(payload.message ?? fallback)
  }

  return payload as T
}

export async function login(input: LoginInput): Promise<LoginPayload['data']> {
  const payload = await requestJson<LoginPayload>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    '登录失败，请稍后重试',
  )

  return payload.data
}

export async function logout(): Promise<LogoutPayload> {
  return requestJson<LogoutPayload>(
    '/api/auth/logout',
    {
      method: 'POST',
    },
    '退出登录失败，请稍后重试',
  )
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const payload = await requestJson<CurrentUserPayload>(
    '/api/auth/me',
    {
      method: 'GET',
    },
    '加载当前用户失败，请稍后重试',
  )

  return payload.data as CurrentUser
}

export async function listSpaces(): Promise<SpacesIndexPayload['data']> {
  try {
    const payload = await tuyau.api.spaces.index({})
    return (payload as SpacesIndexPayload).data as ApiSpace[]
  } catch (error) {
    throw toRequestError(error, '加载空间列表失败，请稍后重试')
  }
}

export async function getSpaceTree(spaceId: string): Promise<SpaceTreePayload['data']> {
  try {
    const payload = await tuyau.api.spaces.tree({
      params: {
        spaceId,
      },
    })
    return (payload as SpaceTreePayload).data as ApiSpaceTree
  } catch (error) {
    throw toRequestError(error, '加载空间树失败，请稍后重试')
  }
}

export async function listDocuments(): Promise<DocumentsIndexPayload['data']> {
  try {
    const payload = await tuyau.api.documents.index({})
    return (payload as DocumentsIndexPayload).data as ApiDocumentSummary[]
  } catch (error) {
    throw toRequestError(error, '加载文档列表失败，请稍后重试')
  }
}

export async function getDocumentById(documentId: string): Promise<DocumentShowPayload['data']> {
  try {
    const payload = await tuyau.api.documents.show({
      params: {
        documentId,
      },
    })
    return (payload as DocumentShowPayload).data as ApiDocumentDetail
  } catch (error) {
    throw toRequestError(error, '加载文档失败，请稍后重试')
  }
}

export async function createSpace(input: CreateSpaceInput): Promise<SpaceStorePayload['data']> {
  try {
    const payload = await tuyau.api.spaces.store({
      body: input,
    })
    return (payload as SpaceStorePayload).data as ApiSpace
  } catch (error) {
    throw toRequestError(error, '创建空间失败，请稍后重试')
  }
}

export async function createDocument(input: CreateDocumentInput): Promise<DocumentStorePayload['data']> {
  try {
    const payload = await tuyau.api.documents.store({
      body: input,
    })
    return (payload as DocumentStorePayload).data as ApiDocumentDetail
  } catch (error) {
    throw toRequestError(error, '创建文档失败，请稍后重试')
  }
}

export async function updateDocument(
  input: { documentId: string } & UpdateDocumentPatch,
): Promise<DocumentUpdatePayload['data']> {
  try {
    const { documentId, ...patch } = input

    const payload = await tuyau.api.documents.update({
      params: {
        documentId,
      },
      // 前端 API 层直接透传 patch contract，避免 transport 组装悄悄固化“全量更新”的假设。
      body: patch,
    })
    return (payload as DocumentUpdatePayload).data
  } catch (error) {
    throw toRequestError(error, '保存文档失败，请稍后重试')
  }
}
