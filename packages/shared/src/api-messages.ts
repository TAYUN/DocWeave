import type { ApiErrorCode } from '@docweave/contracts/api'

export type ApiErrorDefinition = {
  code: ApiErrorCode
  message: string
}

export const apiErrors = {
  validationFailed: { code: 'VALIDATION_FAILED', message: '请求参数校验失败' },
  unauthorized: { code: 'AUTH_UNAUTHORIZED', message: '未登录或登录已失效' },
  forbidden: { code: 'AUTH_FORBIDDEN', message: '没有权限执行该操作' },
  notFound: { code: 'RESOURCE_NOT_FOUND', message: '请求的资源不存在' },
  internalServerError: { code: 'INTERNAL_SERVER_ERROR', message: '服务暂时不可用，请稍后重试' },
  spaceNotFound: { code: 'SPACE_NOT_FOUND', message: '知识空间不存在' },
  documentNotFound: { code: 'DOCUMENT_NOT_FOUND', message: '文档不存在' },
  documentPatchEmpty: { code: 'DOCUMENT_PATCH_EMPTY', message: '至少需要提供一个可编辑字段' },
  missingStableSnapshot: { code: 'DOCUMENT_STABLE_SNAPSHOT_MISSING', message: '文档当前还没有稳定快照' },
  snapshotNotFound: { code: 'DOCUMENT_SNAPSHOT_NOT_FOUND', message: '指定的快照不存在' },
  collaborationTokenFormatInvalid: { code: 'COLLAB_TOKEN_FORMAT_INVALID', message: '协同令牌格式无效' },
  collaborationTokenSignatureInvalid: { code: 'COLLAB_TOKEN_SIGNATURE_INVALID', message: '协同令牌签名无效' },
  collaborationTokenExpired: { code: 'COLLAB_TOKEN_EXPIRED', message: '协同令牌已过期' },
  unauthorizedCollaborationRuntimeRequest: { code: 'COLLAB_RUNTIME_UNAUTHORIZED', message: '未授权的协同运行时请求' },
  editorAiRequestInvalid: { code: 'EDITOR_AI_REQUEST_INVALID', message: '编辑器 AI 请求必须提供 messages 和 toolDefinitions' },
  editorAiDocumentNotFound: { code: 'EDITOR_AI_DOCUMENT_NOT_FOUND', message: '编辑器 AI 对应的文档不存在' },
  editorAiProviderConfigMissing: { code: 'EDITOR_AI_PROVIDER_CONFIG_MISSING', message: '编辑器 AI 服务尚未完成配置' },
  aiProviderReturnedEmptyStream: { code: 'AI_PROVIDER_EMPTY_STREAM', message: 'AI 服务返回了空响应流' },
  invalidPaginationMetadata: { code: 'PAGINATION_METADATA_INVALID', message: '分页元数据格式无效' },
  ragRetrievalFailed: { code: 'RAG_RETRIEVAL_FAILED', message: '知识检索暂时不可用，请稍后重试' },
  ragGenerationFailed: { code: 'RAG_GENERATION_FAILED', message: '知识问答生成暂时不可用，请稍后重试' },
  ragStreamFailed: { code: 'RAG_STREAM_FAILED', message: '知识问答流暂时不可用，请稍后重试' },
} as const satisfies Record<string, ApiErrorDefinition>

export const apiSuccessMessages = {
  documentCreated: '文档创建成功', documentUpdated: '文档更新成功', documentSnapshotCreated: '文档快照创建成功', documentIndexTriggered: '文档索引任务已触发', spaceCreated: '知识空间创建成功', loggedOutSuccessfully: '退出登录成功',
} as const

export const mcpMessages = {
  documentIdRequired: '必须提供 documentId', spaceIdRequired: '必须提供 spaceId', queryRequired: '必须提供 query', nameAndSummaryRequired: '必须同时提供 name 和 summary', spaceIdAndTitleRequired: '必须同时提供 spaceId 和 title',
} as const

export const apiErrorsByCode: Record<ApiErrorCode, ApiErrorDefinition> = Object.values(apiErrors).reduce((accumulator, definition) => { accumulator[definition.code] = definition; return accumulator }, {} as Record<ApiErrorCode, ApiErrorDefinition>)

export function isApiErrorCode(code: unknown): code is ApiErrorCode { return typeof code === 'string' && code in apiErrorsByCode }
export function getApiErrorDefinitionByCode(code: ApiErrorCode | null | undefined) { if (!code) return null; return apiErrorsByCode[code] ?? null }
