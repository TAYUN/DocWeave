import type { ApiErrorCode, ApiErrorResponse } from '@docweave/contracts/api'
import {
  apiErrors,
  apiSuccessMessages,
  getApiErrorDefinitionByCode,
  isApiErrorCode,
  mcpMessages,
  type ApiErrorDefinition,
} from '@docweave/shared/api-messages'
import { SimpleMessagesProvider } from '@vinejs/vine'

const knownEnglishErrorMap: Record<string, ApiErrorDefinition> = {
  'Validation failed': apiErrors.validationFailed,
  'Unauthorized': apiErrors.unauthorized,
  'Forbidden': apiErrors.forbidden,
  'Not found': apiErrors.notFound,
  'Internal server error': apiErrors.internalServerError,
  'Space not found': apiErrors.spaceNotFound,
  'Document not found': apiErrors.documentNotFound,
  'At least one editable field is required': apiErrors.documentPatchEmpty,
  'Document has no stable snapshot yet': apiErrors.missingStableSnapshot,
  'Snapshot not found': apiErrors.snapshotNotFound,
  'Invalid collaboration token format': apiErrors.collaborationTokenFormatInvalid,
  'Invalid collaboration token signature': apiErrors.collaborationTokenSignatureInvalid,
  'Collaboration token expired': apiErrors.collaborationTokenExpired,
  'Unauthorized collaboration runtime request': apiErrors.unauthorizedCollaborationRuntimeRequest,
  'Editor AI messages and toolDefinitions are required': apiErrors.editorAiRequestInvalid,
  'Editor AI document not found': apiErrors.editorAiDocumentNotFound,
  'DASHSCOPE_API_KEY is required for editor AI': apiErrors.editorAiProviderConfigMissing,
  'AI provider returned an empty stream': apiErrors.aiProviderReturnedEmptyStream,
  'Invalid pagination metadata. Expected metadata to contain Lucid pagination keys':
    apiErrors.invalidPaginationMetadata,
}

export class ApiContractError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string = getApiErrorDefinitionByCode(code)?.message ?? '服务暂时不可用，请稍后重试'
  ) {
    super(message)
    this.name = 'ApiContractError'
  }
}

// 这里把常见框架/领域旧英文错误收口到稳定错误码，避免前后端继续通过展示文案联动。
export function resolveKnownApiError(message: string | null | undefined) {
  if (!message) {
    return null
  }

  const directMatch = knownEnglishErrorMap[message]

  if (directMatch) {
    return directMatch
  }

  if (message.startsWith('Document not found:')) {
    return apiErrors.documentNotFound
  }

  if (message.startsWith('Space not found:')) {
    return apiErrors.spaceNotFound
  }

  return null
}

export function resolveFallbackApiError(status: number) {
  switch (status) {
    case 401:
      return apiErrors.unauthorized
    case 403:
      return apiErrors.forbidden
    case 404:
      return apiErrors.notFound
    default:
      return apiErrors.internalServerError
  }
}

export function toApiErrorResponse(
  definition: ApiErrorDefinition,
  extra: Pick<ApiErrorResponse, 'errors'> = {}
) {
  return {
    code: definition.code,
    message: definition.message,
    ...extra,
  } satisfies ApiErrorResponse
}

export const validationMessagesProvider = new SimpleMessagesProvider(
  {
    required: '{{ field }}不能为空',
    string: '{{ field }}必须是字符串',
    object: '{{ field }}必须是对象',
    array: '{{ field }}必须是数组',
    number: '{{ field }}必须是数字',
    enum: '{{ field }}的取值不合法',
    email: '{{ field }}格式不正确',
    minLength: '{{ field }}长度不能少于 {{ min }} 个字符',
    maxLength: '{{ field }}长度不能超过 {{ max }} 个字符',
    positive: '{{ field }}必须大于 0',
    withoutDecimals: '{{ field }}必须是整数',
    sameAs: '{{ field }}必须与 {{ otherField }} 保持一致',
    unique: '{{ field }}已存在，请更换后重试',
  },
  {
    email: '邮箱',
    password: '密码',
    passwordConfirmation: '确认密码',
    fullName: '姓名',
    name: '空间名称',
    summary: '摘要',
    spaceId: '空间 ID',
    documentId: '文档 ID',
    title: '标题',
    content: '正文内容',
    snapshotVersion: '快照版本',
    targetLanguage: '目标语言',
    action: '操作类型',
    searchText: '检索内容',
    message: '消息内容',
  }
)

export {
  apiErrors,
  apiSuccessMessages,
  getApiErrorDefinitionByCode,
  isApiErrorCode,
  mcpMessages,
  type ApiErrorDefinition,
}
