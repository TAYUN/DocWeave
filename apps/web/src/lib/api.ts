import type {
  ApiErrorCode,
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
  CreateDocumentIndexJobResultDto,
  CreateDocumentInput,
  CreateDocumentSnapshotResultDto,
  DocumentDetailDto,
  DocumentProcessingStatusDto,
  DocumentSummaryDto,
  UpdateDocumentInput,
} from '@docweave/contracts/document'
import type {
  RagChatRequest,
  RagSearchRequest,
  RagSearchResponse,
  RagStreamEvent,
} from '@docweave/contracts/rag'
import type { CreateSpaceInput, SpaceDto, SpaceTreeDto } from '@docweave/contracts/space'
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
type DocumentProcessingStatusPayload = SuccessPayload<
  AwaitedRoute<typeof tuyau.api.documents.status>
>
type DocumentSnapshotPayload = SuccessPayload<
  AwaitedRoute<typeof tuyau.api.documents.createSnapshot>
>
type DocumentIndexJobPayload = SuccessPayload<AwaitedRoute<typeof tuyau.api.documents.triggerIndex>>

export type ApiSpace = SpaceDto
export type ApiDocumentSummary = DocumentSummaryDto
export type ApiDocumentDetail = DocumentDetailDto
export type ApiDocumentProcessingStatus = DocumentProcessingStatusDto
export type ApiSpaceTree = SpaceTreeDto
export type CurrentUser = CurrentUserDto
export type ApiCollaborationSession = CollaborationSessionDto
export type UpdateDocumentPatch = UpdateDocumentInput
export type LoginInput = {
  email: string
  password: string
}

/**
 * 页面状态需要根据稳定错误码分支，不能反向解析后端或网络错误文案。
 */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly code?: ApiErrorCode,
    readonly status?: number
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

export class AuthError extends ApiRequestError {
  constructor(message: string, code?: ApiErrorCode, status?: number) {
    super(message, code, status)
    this.name = 'AuthError'
  }
}

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

  const validationMessage = payload?.errors?.find(
    (issue) => typeof issue.message === 'string'
  )?.message
  return normalizeLegacyErrorMessage(payload?.message ?? validationMessage, fallback)
}

function toApiRequestError(
  status: number | undefined,
  payload: ApiErrorResponse | undefined,
  fallback: string
) {
  const message = readErrorMessage(payload, fallback)

  if (status === 401) {
    return new AuthError(message, payload?.code, status)
  }

  return new ApiRequestError(message, payload?.code, status)
}

function toRequestError(error: unknown, fallback: string) {
  // 在统一 API 层把服务端 message 收口成 Error，页面和 query 层就不用了解 Tuyau 的错误细节。
  if (error instanceof TuyauError) {
    const response = error.response as ApiErrorResponse | undefined
    // 让路由壳层和 query 可以统一识别“需要重新登录”的分支，而不是把它混进普通请求失败。
    return toApiRequestError(error.isStatus(401) ? 401 : undefined, response, fallback)
  }

  if (error instanceof Error) {
    if (error instanceof ApiRequestError) {
      return error
    }

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
    throw toApiRequestError(response.status, payload, fallback)
  }

  return payload as T
}

function createAuthenticatedHeaders(init?: HeadersInit) {
  const headers = new Headers(init)
  headers.set('content-type', 'application/json')

  const token = getAccessToken()
  if (token) {
    headers.set('authorization', `Bearer ${token}`)
  }

  return headers
}

export type RagChatStreamOptions = {
  signal?: AbortSignal
  onEvent(event: RagStreamEvent): void
}

/**
 * RAG search 未通过 Tuyau，因为该 endpoint 的结果需与 chat 的 fetch/SSE 边界保持一致。
 */
export async function searchRag(input: RagSearchRequest): Promise<RagSearchResponse> {
  const payload = await requestJson<ApiSuccessResponse<RagSearchResponse>>(
    '/api/rag/search',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    '知识搜索失败，请稍后重试'
  )

  return payload.data
}

/**
 * 消费单轮 RAG SSE。连接结束、reader 清理和客户端 abort 都不是领域事件，不能伪造 finish。
 */
export async function streamRagChat(
  input: RagChatRequest,
  { signal, onEvent }: RagChatStreamOptions
): Promise<void> {
  const response = await fetch('/api/rag/chat', {
    method: 'POST',
    headers: createAuthenticatedHeaders(),
    body: JSON.stringify(input),
    signal,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiErrorResponse
    throw toApiRequestError(response.status, payload, '知识问答失败，请稍后重试')
  }

  if (!response.body) {
    throw new ApiRequestError('知识问答流不可用，请稍后重试', 'RAG_STREAM_FAILED')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let terminalEventReceived = false

  try {
    while (!terminalEventReceived) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })

      const frames = buffer.split(/\r?\n\r?\n/)
      buffer = frames.pop() ?? ''

      for (const frame of frames) {
        const event = parseRagSseFrame(frame)
        if (!event) continue

        onEvent(event)
        terminalEventReceived = event.type === 'finish' || event.type === 'error'
        if (terminalEventReceived) break
      }

      if (done) break
    }

    // 正常 SSE 会以空行终止 frame；这里仍接住连接关闭时尚未带分隔符的最后一个有效 data frame。
    if (!terminalEventReceived && buffer.trim()) {
      const event = parseRagSseFrame(buffer)
      if (event) {
        onEvent(event)
        terminalEventReceived = event.type === 'finish' || event.type === 'error'
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/** Exported for focused wire-format tests without creating a network response. */
export function parseRagSseFrame(frame: string): RagStreamEvent | null {
  const data = frame
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).trimStart())
    .join('\n')

  if (!data) return null

  try {
    const event = JSON.parse(data) as RagStreamEvent
    if (
      !event ||
      typeof event !== 'object' ||
      !('type' in event) ||
      typeof event.type !== 'string'
    ) {
      throw new Error('Invalid RAG stream event')
    }

    return event
  } catch {
    throw new ApiRequestError('知识问答流格式无效，请稍后重试', 'RAG_STREAM_FAILED')
  }
}

export async function login(input: LoginInput): Promise<LoginResultDto> {
  const payload = await requestJson<ApiSuccessResponse<LoginResultDto>>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    '登录失败，请稍后重试'
  )

  return payload.data
}

export async function logout(): Promise<ApiMessageResponse> {
  return requestJson<ApiMessageResponse>(
    '/api/auth/logout',
    {
      method: 'POST',
    },
    '退出登录失败，请稍后重试'
  )
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const payload = await requestJson<ApiSuccessResponse<CurrentUserDto>>(
    '/api/auth/me',
    {
      method: 'GET',
    },
    '加载当前用户失败，请稍后重试'
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

/**
 * 将文档处理状态收口在前端 API 边界，页面不依赖 Tuyau 的传输返回 shape。
 */
export async function getDocumentProcessingStatus(
  documentId: string
): Promise<ApiDocumentProcessingStatus> {
  try {
    const payload = await tuyau.api.documents.status({
      params: {
        documentId,
      },
    })
    return (payload as DocumentProcessingStatusPayload).data as DocumentProcessingStatusDto
  } catch (error) {
    throw toRequestError(error, '加载文档索引状态失败，请稍后重试')
  }
}

/**
 * 文档页通过这两个 API 明确推进“正文 -> 稳定快照 -> 后台索引”的状态，
 * 不把 RAG 页的只读状态查询误当成建立索引的入口。
 */
export async function createDocumentSnapshot(
  documentId: string
): Promise<CreateDocumentSnapshotResultDto> {
  try {
    const payload = await tuyau.api.documents.createSnapshot({
      params: { documentId },
    })
    return (payload as DocumentSnapshotPayload).data as CreateDocumentSnapshotResultDto
  } catch (error) {
    throw toRequestError(error, '创建稳定快照失败，请稍后重试')
  }
}

export async function triggerDocumentIndex(
  documentId: string,
  snapshotVersion?: number
): Promise<CreateDocumentIndexJobResultDto> {
  try {
    const payload = await tuyau.api.documents.triggerIndex({
      params: { documentId },
      body: snapshotVersion === undefined ? {} : { snapshotVersion },
    })
    return (payload as DocumentIndexJobPayload).data as CreateDocumentIndexJobResultDto
  } catch (error) {
    throw toRequestError(error, '提交知识库索引失败，请稍后重试')
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

export async function createDocument(
  input: CreateDocumentInput
): Promise<DocumentStorePayload['data']> {
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
  input: { documentId: string } & UpdateDocumentPatch
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
    '加载协同令牌失败，请稍后重试'
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
