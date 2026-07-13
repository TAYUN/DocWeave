import type {
  ApiErrorResponse,
  ApiMessageResponse,
  ApiSuccessResponse,
} from '@docweave/contracts/api'
import { apiErrorsByCode } from '@docweave/shared/api-messages'
import type { CurrentUserDto, LoginResultDto } from '@docweave/contracts/auth'
import type {
  CollaborationSessionDto,
  CollaborationTokenPayload,
} from '@docweave/contracts/collaboration'
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
export type ApiCollaborationSession = CollaborationSessionDto
export type UpdateDocumentPatch = UpdateDocumentInput
export type LoginInput = {
  email: string
  password: string
}

export class AuthError extends Error {}

function normalizeLegacyErrorMessage(message: string | null | undefined, fallback: string) {
  if (!message) return fallback

  if (message.startsWith('Document not found:')) {
    return '文档不存在'
  }

  if (message.startsWith('Space not found:')) {
    return '知识空间不存在'
  }

  if (/failed to fetch|networkerror/i.test(message)) {
    return '无法连接到服务器，请检查网络后重试'
  }

  return message
}

function readErrorMessage(payload: ApiErrorResponse | undefined, fallback: string) {
  if (payload?.code && apiErrorsByCode[payload.code]) {
    return apiErrorsByCode[payload.code].message
  }

  const validationMessage = payload?.errors?.find((issue) => typeof issue.message === 'string')?.message
  return normalizeLegacyErrorMessage(payload?.message ?? validationMessage, fallback)
}

function toRequestError(error: unknown, fallback: string) {
  // 在统一 API 层把服务端 message 收口成 Error，页面和 query 层就不用了解 Tuyau 的错误细节。
  if (error instanceof TuyauError) {
    const response = error.response as ApiErrorResponse | undefined
    const message = readErrorMessage(response, fallback)

    // 让路由壳层和 query 可以统一识别“需要重新登录”的分支，而不是把它混进普通请求失败。
    if (error.isStatus(401)) {
      return new AuthError(message)
    }

    return new Error(message)
  }

  if (error instanceof Error) {
    return new Error(normalizeLegacyErrorMessage(error.message, fallback))
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
  const payload = (await response.json().catch(() => ({}))) as ApiErrorResponse & T

  if (!response.ok) {
    const message = readErrorMessage(payload, fallback)

    if (response.status === 401) {
      throw new AuthError(message)
    }

    throw new Error(message)
  }

  return payload as T
}

export async function login(input: LoginInput): Promise<LoginResultDto> {
  const payload = await requestJson<ApiSuccessResponse<LoginResultDto>>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    '登录失败，请稍后重试',
  )

  return payload.data
}

export async function logout(): Promise<ApiMessageResponse> {
  return requestJson<ApiMessageResponse>(
    '/api/auth/logout',
    {
      method: 'POST',
    },
    '退出登录失败，请稍后重试',
  )
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const payload = await requestJson<ApiSuccessResponse<CurrentUserDto>>(
    '/api/auth/me',
    {
      method: 'GET',
    },
    '加载当前用户失败，请稍后重试',
  )

  return payload.data
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

export async function getCollaborationToken(documentId: string): Promise<ApiCollaborationSession> {
  const payload = await requestJson<ApiSuccessResponse<CollaborationSessionDto>>(
    '/api/collaboration/token',
    {
      method: 'POST',
      body: JSON.stringify({ documentId }),
    },
    '加载协同令牌失败，请稍后重试',
  )

  return payload.data
}

export function readCollaborationTokenPayload(token: string): CollaborationTokenPayload {
  const [encodedPayload] = token.split('.')

  if (!encodedPayload) {
    throw new Error('协同令牌格式不正确')
  }

  const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`

  return JSON.parse(window.atob(padded)) as CollaborationTokenPayload
}
