export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'AUTH_UNAUTHORIZED'
  | 'AUTH_FORBIDDEN'
  | 'RESOURCE_NOT_FOUND'
  | 'SPACE_NOT_FOUND'
  | 'DOCUMENT_NOT_FOUND'
  | 'DOCUMENT_PATCH_EMPTY'
  | 'DOCUMENT_STABLE_SNAPSHOT_MISSING'
  | 'DOCUMENT_SNAPSHOT_NOT_FOUND'
  | 'COLLAB_TOKEN_FORMAT_INVALID'
  | 'COLLAB_TOKEN_SIGNATURE_INVALID'
  | 'COLLAB_TOKEN_EXPIRED'
  | 'COLLAB_RUNTIME_UNAUTHORIZED'
  | 'EDITOR_AI_REQUEST_INVALID'
  | 'EDITOR_AI_DOCUMENT_NOT_FOUND'
  | 'EDITOR_AI_PROVIDER_CONFIG_MISSING'
  | 'AI_PROVIDER_EMPTY_STREAM'
  | 'PAGINATION_METADATA_INVALID'
  | 'INTERNAL_SERVER_ERROR'

export type ApiSuccessResponse<T> = {
  data: T
}

export type ApiErrorItem = {
  field?: string
  message?: string
}

export type ApiErrorResponse = {
  code?: ApiErrorCode
  message?: string
  errors?: ApiErrorItem[]
}

export type ApiMessageResponse = {
  message: string
}
