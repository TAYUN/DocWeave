import type { DocumentProcessingStatusDto } from '@docweave/contracts/document'
import type {
  RagCitation,
  RagSearchResponse,
  RagStreamError,
  RagStreamEvent,
} from '@docweave/contracts/rag'
import type { ApiRequestError } from '@/lib/api'

export type RagCitationViewModel = {
  id: string
  documentId: string
  snapshotVersion: number
  blockId: string
  quote: string | null
}

export type RagSearchViewModel = {
  state:
    | 'idle'
    | 'loading'
    | 'index-loading'
    | 'index-failed'
    | 'results'
    | 'empty'
    | 'restricted'
    | 'no-index'
    | 'failed'
  searchText: string
  hits: Array<{
    score: number
    snippet: string
    citation: RagCitationViewModel
  }>
  errorMessage: string | null
}

export type RagChatViewModel = {
  state:
    | 'idle'
    | 'streaming'
    | 'index-loading'
    | 'index-failed'
    | 'completed'
    | 'cancelled'
    | 'restricted'
    | 'no-index'
    | 'failed'
  answer: string
  citations: RagCitationViewModel[]
  errorMessage: string | null
}

export type RagSearchStateInput =
  | { status: 'idle' }
  | { status: 'loading'; searchText: string }
  | { status: 'index-loading'; searchText: string }
  | { status: 'index-failed'; searchText: string; error: unknown }
  | { status: 'success'; response: RagSearchResponse }
  // 是否可搜索来自 document processing status，而不是空 hits。
  | { status: 'no-index'; searchText: string }
  | { status: 'failed'; searchText: string; error: unknown }

export type RagChatStateInput =
  | { status: 'idle' }
  | { status: 'streaming'; events: RagStreamEvent[] }
  | { status: 'index-loading'; events: RagStreamEvent[] }
  | { status: 'index-failed'; events: RagStreamEvent[]; error: unknown }
  | { status: 'cancelled'; events: RagStreamEvent[] }
  // 页面通过显式的索引状态决定该分支，SSE retrieval 的空 citations 只表示没有命中。
  | { status: 'no-index'; events: RagStreamEvent[] }
  | { status: 'failed'; events: RagStreamEvent[]; error: unknown }

export function toRagSearchViewModel(input: RagSearchStateInput): RagSearchViewModel {
  if (input.status === 'idle') {
    return { state: 'idle', searchText: '', hits: [], errorMessage: null }
  }

  if (input.status === 'loading') {
    return { state: 'loading', searchText: input.searchText, hits: [], errorMessage: null }
  }

  if (input.status === 'index-loading') {
    return { state: 'index-loading', searchText: input.searchText, hits: [], errorMessage: null }
  }

  if (input.status === 'index-failed') {
    return {
      state: 'index-failed',
      searchText: input.searchText,
      hits: [],
      errorMessage: getErrorMessage(input.error),
    }
  }

  if (input.status === 'failed') {
    return {
      state: isRestricted(input.error) ? 'restricted' : 'failed',
      searchText: input.searchText,
      hits: [],
      errorMessage: getErrorMessage(input.error),
    }
  }

  if (input.status === 'no-index') {
    return { state: 'no-index', searchText: input.searchText, hits: [], errorMessage: null }
  }

  const hits = input.response.hits.map((hit) => ({
    score: hit.score,
    snippet: hit.snippet,
    citation: toRagCitationViewModel(hit.citation),
  }))

  return {
    state: hits.length ? 'results' : 'empty',
    searchText: input.response.searchText,
    hits,
    errorMessage: null,
  }
}

export function toRagChatViewModel(input: RagChatStateInput): RagChatViewModel {
  if (input.status === 'idle') {
    return { state: 'idle', answer: '', citations: [], errorMessage: null }
  }

  if (input.status === 'index-loading') {
    return { state: 'index-loading', answer: '', citations: [], errorMessage: null }
  }

  if (input.status === 'index-failed') {
    return {
      state: 'index-failed',
      answer: '',
      citations: [],
      errorMessage: getErrorMessage(input.error),
    }
  }

  const events = input.events
  const answer = events
    .filter(
      (event): event is Extract<RagStreamEvent, { type: 'text-delta' }> =>
        event.type === 'text-delta'
    )
    .map((event) => event.delta)
    .join('')
  const citations = uniqueCitations(
    events.flatMap((event) => {
      if (event.type === 'citation') return [event.citation]
      if (event.type === 'retrieval' || event.type === 'finish') return event.citations
      return []
    })
  )
  const streamError = events.find(
    (event): event is Extract<RagStreamEvent, { type: 'error' }> => event.type === 'error'
  )

  if (input.status === 'cancelled') {
    return { state: 'cancelled', answer, citations, errorMessage: null }
  }

  if (input.status === 'no-index') {
    return { state: 'no-index', answer, citations, errorMessage: null }
  }

  if (input.status === 'failed' || streamError) {
    const error = streamError?.error ?? (input.status === 'failed' ? input.error : undefined)
    const restricted = isRestricted(error)
    return {
      state: restricted ? 'restricted' : 'failed',
      answer: restricted ? '' : answer,
      citations: restricted ? [] : citations,
      errorMessage: getErrorMessage(error),
    }
  }

  const finished = events.some((event) => event.type === 'finish')
  return {
    state: finished ? 'completed' : 'streaming',
    answer,
    citations,
    errorMessage: null,
  }
}

export type RagIndexState = 'ready' | 'loading' | 'failed' | 'failed-index' | 'no-index'

export function getRagIndexState(
  documents: Array<{ id?: string; spaceId: string; latestIndexedVersion: number | null }>,
  options: {
    spaceId: string | null
    pending: boolean
    error: Error | null
    statuses?: DocumentProcessingStatusDto[]
    statusesPending?: boolean
    statusesError?: Error | null
  }
): RagIndexState {
  if (options.pending) return 'loading'
  if (options.error) return 'failed'
  if (options.statusesPending) return 'loading'
  if (options.statusesError) return 'failed'

  const scopedDocumentIds = new Set(
    documents
      .filter((document) => !options.spaceId || document.spaceId === options.spaceId)
      .map((document) => document.id)
      .filter((documentId): documentId is string => Boolean(documentId))
  )
  const scopedStatuses = (options.statuses ?? []).filter((status) =>
    scopedDocumentIds.has(status.documentId)
  )

  if (
    scopedStatuses.some(
      (status) => status.latestIndexedVersion === null && status.latestIndexJob?.status === 'failed'
    )
  ) {
    return 'failed-index'
  }

  return scopedStatuses.some((status) => status.latestIndexedVersion !== null)
    ? 'ready'
    : 'no-index'
}

export function getRagFailedIndexMessage(statuses: DocumentProcessingStatusDto[]) {
  const failedJob = statuses.find(
    (status) => status.latestIndexedVersion === null && status.latestIndexJob?.status === 'failed'
  )?.latestIndexJob

  return failedJob?.errorMessage ?? '一个或多个文档的最新索引失败，请修复后重新建立索引。'
}

export function toRagCitationViewModel(citation: RagCitation): RagCitationViewModel {
  return {
    id: citation.id,
    documentId: citation.documentId,
    snapshotVersion: citation.snapshotVersion,
    blockId: citation.blockId,
    quote: citation.quote ?? null,
  }
}

function uniqueCitations(citations: RagCitation[]) {
  return [
    ...new Map(
      citations.map((citation) => [citation.id, toRagCitationViewModel(citation)])
    ).values(),
  ]
}

function isRestricted(error: unknown) {
  return (
    getApiErrorCode(error) === 'AUTH_FORBIDDEN' ||
    getRagStreamErrorCode(error) === 'RAG_PERMISSION_DENIED'
  )
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (
    typeof error === 'object' &&
    error &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }
  return '请求失败，请稍后重试'
}

function getApiErrorCode(error: unknown) {
  return typeof error === 'object' && error && 'code' in error
    ? (error as ApiRequestError).code
    : undefined
}

function getRagStreamErrorCode(error: unknown) {
  return typeof error === 'object' && error && 'code' in error
    ? (error as Pick<RagStreamError, 'code'>).code
    : undefined
}
